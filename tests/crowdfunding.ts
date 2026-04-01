import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Crowdfunding } from '../target/types/crowdfunding';
import { assert } from 'chai';

describe('crowdfunding', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Crowdfunding as Program<Crowdfunding>;

  const creator = anchor.web3.Keypair.generate();
  const donor = anchor.web3.Keypair.generate();
  let campaignPda: anchor.web3.PublicKey;

  before(async () => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(creator.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(donor.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
    );

    [campaignPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('CAMPAIGN_DEMO'), creator.publicKey.toBuffer()],
      program.programId
    );
  });

  it('Creates a campaign', async () => {
    await program.methods
      .create('Save the Ocean', 'A campaign to clean the ocean')
      .accounts({
        campaign: campaignPda,
        user: creator.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    const campaign = await program.account.campaign.fetch(campaignPda);
    assert.ok(campaign.name === 'Save the Ocean');
    assert.ok(campaign.amountDonated.toString() === '0');
    assert.ok(campaign.admin.toString() === creator.publicKey.toString());
    console.log('Campaign created:', campaign.name);
    console.log('Amount donated:', campaign.amountDonated.toString());
  });

  it('Donates to a campaign', async () => {
    const donateAmount = new anchor.BN(0.5 * anchor.web3.LAMPORTS_PER_SOL);

    await program.methods
      .donate(donateAmount)
      .accounts({
        campaign: campaignPda,
        user: donor.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([donor])
      .rpc();

    const campaign = await program.account.campaign.fetch(campaignPda);
    assert.ok(campaign.amountDonated.toString() === donateAmount.toString());
    console.log('Amount donated:', campaign.amountDonated.toString(), 'lamports');
  });

  it('Withdraws from a campaign', async () => {
    const withdrawAmount = new anchor.BN(0.1 * anchor.web3.LAMPORTS_PER_SOL);
    const balanceBefore = await provider.connection.getBalance(creator.publicKey);

    await program.methods
      .withdraw(withdrawAmount)
      .accounts({
        campaign: campaignPda,
        user: creator.publicKey,
      })
      .signers([creator])
      .rpc();

    const balanceAfter = await provider.connection.getBalance(creator.publicKey);
    assert.ok(balanceAfter > balanceBefore);
    console.log('Balance before:', balanceBefore);
    console.log('Balance after:', balanceAfter);
    console.log('Withdrawn successfully!');
  });
});
