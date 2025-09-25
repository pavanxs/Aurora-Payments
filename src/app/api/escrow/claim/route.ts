import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/index';
import { escrowPayment } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { aptosClient } from '@/utils/aptosClient';
import { MODULE_ADDRESS } from '@/constants';

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      escrowAddress, 
      paymentId, 
      recipientAddress,
      claimTransactionHash 
    } = body;

    // Validate required fields
    if (!escrowAddress || paymentId === undefined || !recipientAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find the payment in database
    const [payment] = await db
      .select()
      .from(escrowPayment)
      .where(
        and(
          eq(escrowPayment.escrowAddress, escrowAddress),
          eq(escrowPayment.paymentId, paymentId)
        )
      );

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    if (payment.status !== 'pending') {
      return NextResponse.json(
        { error: 'Payment already claimed or expired' },
        { status: 400 }
      );
    }

    // Verify the authenticated user matches the payment provider info
    const userAccount = session.user.accounts?.find(
      account => account.providerId === payment.provider
    );

    if (!userAccount || userAccount.accountId !== payment.providerUserId) {
      return NextResponse.json(
        { error: 'Not authorized to claim this payment' },
        { status: 403 }
      );
    }

    // If transaction hash provided, verify it on-chain
    if (claimTransactionHash) {
      try {
        const txn = await aptosClient().getTransactionByHash({ 
          transactionHash: claimTransactionHash 
        });
        
        if (!txn.success) {
          return NextResponse.json(
            { error: 'Claim transaction failed on-chain' },
            { status: 400 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Failed to verify claim transaction' },
          { status: 400 }
        );
      }
    }

    // Update payment status in database
    const [updatedPayment] = await db
      .update(escrowPayment)
      .set({
        status: 'claimed',
        claimedAt: new Date(),
        claimedBy: recipientAddress,
        claimTransactionHash,
      })
      .where(
        and(
          eq(escrowPayment.escrowAddress, escrowAddress),
          eq(escrowPayment.paymentId, paymentId)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      payment: {
        id: updatedPayment.id,
        paymentId: updatedPayment.paymentId,
        status: updatedPayment.status,
        claimedAt: updatedPayment.claimedAt,
        claimedBy: updatedPayment.claimedBy,
        amount: updatedPayment.amount.toString()
      }
    });

  } catch (error: any) {
    console.error('Claim API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to find payments for authenticated user
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const escrowAddress = searchParams.get('escrowAddress');
    const provider = searchParams.get('provider');

    if (!escrowAddress || !provider) {
      return NextResponse.json(
        { error: 'Missing escrowAddress or provider parameter' },
        { status: 400 }
      );
    }

    // Get user's provider account ID
    const userAccount = session.user.accounts?.find(
      account => account.providerId === provider
    );

    if (!userAccount) {
      return NextResponse.json(
        { error: 'User not connected to specified provider' },
        { status: 400 }
      );
    }

    // Find payments for this user
    const payments = await db
      .select()
      .from(escrowPayment)
      .where(
        and(
          eq(escrowPayment.escrowAddress, escrowAddress),
          eq(escrowPayment.provider, provider),
          eq(escrowPayment.providerUserId, userAccount.accountId),
          eq(escrowPayment.status, 'pending')
        )
      );

    return NextResponse.json({
      success: true,
      payments: payments.map(p => ({
        id: p.id,
        paymentId: p.paymentId,
        senderAddress: p.senderAddress,
        amount: p.amount.toString(),
        message: p.message,
        createdAt: p.createdAt,
        status: p.status
      }))
    });

  } catch (error: any) {
    console.error('Get payments API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
