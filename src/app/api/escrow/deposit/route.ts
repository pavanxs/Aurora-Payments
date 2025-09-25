import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/index';
import { escrowPayment } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { aptosClient } from '@/utils/aptosClient';
import { MODULE_ADDRESS } from '@/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      escrowAddress, 
      transactionHash, 
      provider, 
      providerUserId, 
      senderAddress, 
      amount, 
      message 
    } = body;

    // Validate required fields
    if (!escrowAddress || !transactionHash || !provider || !providerUserId || !senderAddress || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify transaction on-chain
    try {
      const txn = await aptosClient().getTransactionByHash({ transactionHash });
      
      // Verify the transaction was successful
      if (!txn.success) {
        return NextResponse.json(
          { error: 'Transaction failed on-chain' },
          { status: 400 }
        );
      }

      // TODO: Additional validation - verify the transaction actually called deposit_payment
      // with the correct parameters
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to verify transaction on-chain' },
        { status: 400 }
      );
    }

    // Get the payment ID from the smart contract by checking events or view functions
    // For now, we'll use a simple counter approach
    const existingPayments = await db
      .select()
      .from(escrowPayment)
      .where(eq(escrowPayment.escrowAddress, escrowAddress));
    
    const paymentId = existingPayments.length;

    // Store payment metadata in database
    const [payment] = await db.insert(escrowPayment).values({
      id: `${escrowAddress}-${paymentId}`,
      escrowAddress,
      paymentId,
      transactionHash,
      provider,
      providerUserId,
      senderAddress,
      amount: BigInt(amount),
      message,
      status: 'pending'
    }).returning();

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        paymentId: payment.paymentId,
        provider: payment.provider,
        providerUserId: payment.providerUserId,
        amount: payment.amount.toString(),
        status: payment.status
      }
    });

  } catch (error: any) {
    console.error('Deposit API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
