import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/index';
import { escrowPayment } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// This endpoint verifies OAuth and provides authorization for claiming payments
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
      provider,
      recipientAddress 
    } = body;

    // Validate required fields
    if (!escrowAddress || paymentId === undefined || !provider || !recipientAddress) {
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

    if (!userAccount) {
      return NextResponse.json(
        { error: `User not connected to ${payment.provider}` },
        { status: 403 }
      );
    }

    if (userAccount.accountId !== payment.providerUserId) {
      return NextResponse.json(
        { 
          error: 'Provider user ID mismatch',
          expected: payment.providerUserId,
          actual: userAccount.accountId
        },
        { status: 403 }
      );
    }

    // Generate verification data for the smart contract
    const verificationData = {
      escrowAddress,
      paymentId: payment.paymentId,
      provider: payment.provider,
      providerUserId: payment.providerUserId,
      recipientAddress,
      amount: payment.amount.toString(),
      senderAddress: payment.senderAddress,
      verified: true,
      verifiedAt: new Date().toISOString(),
      userInfo: {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image
      }
    };

    return NextResponse.json({
      success: true,
      verification: verificationData,
      message: `Successfully verified ${provider} account: ${payment.providerUserId}`
    });

  } catch (error: any) {
    console.error('Verify API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
