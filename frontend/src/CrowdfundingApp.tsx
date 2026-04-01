import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Program, AnchorProvider, web3, BN, setProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import idl from './crowdfunding.json';

const PROGRAM_ID = new PublicKey('7HWVQUBtomi7pLhThdJzXcYTBPnT9tytm3GZa46p4pee');

interface Campaign {
  pubkey: PublicKey;
  name: string;
  description: string;
  amountDonated: number;
  admin: PublicKey;
}

export default function CrowdfundingApp() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [donateAmount, setDonateAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const getProgram = () => {
    const provider = new AnchorProvider(connection, wallet as any, {});
    setProvider(provider);
    return new Program(idl as any, provider);
  };

  const getCampaignPda = (ownerPubkey: PublicKey) => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('CAMPAIGN_DEMO'), ownerPubkey.toBuffer()],
      PROGRAM_ID
    );
    return pda;
  };

  const fetchCampaigns = async () => {
    try {
      const provider = new AnchorProvider(connection, wallet as any, {});
      const program = new Program(idl as any, provider) as any;
      const allCampaigns = await program.account.campaign.all();
      setCampaigns(allCampaigns.map((c: any) => ({
        pubkey: c.publicKey,
        name: c.account.name,
        description: c.account.description,
        amountDonated: c.account.amountDonated.toNumber(),
        admin: c.account.admin,
      })));
    } catch (e) {
      console.error('Error fetching campaigns:', e);
    }
  };

  useEffect(() => {
    if (wallet.connected) fetchCampaigns();
  }, [wallet.connected]);

  const createCampaign = async () => {
    if (!wallet.connected || !wallet.publicKey) return setStatus('Please connect your wallet first!');
    if (!name || !description) return setStatus('Please fill in all fields!');
    setLoading(true);
    setStatus('');
    try {
      const program = getProgram();
      const campaignPda = getCampaignPda(wallet.publicKey);
      await program.methods
        .create(name, description)
        .accountsPartial({
          campaign: campaignPda,
          user: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      setStatus('Campaign created successfully!');
      setName('');
      setDescription('');
      fetchCampaigns();
    } catch (e: any) {
      setStatus('Error: ' + e.message);
    }
    setLoading(false);
  };

  const donate = async (campaignPubkey: PublicKey) => {
    if (!wallet.connected || !wallet.publicKey) return setStatus('Please connect your wallet!');
    if (!donateAmount) return setStatus('Enter donation amount!');
    setLoading(true);
    setStatus('');
    try {
      const program = getProgram();
      const amount = new BN(parseFloat(donateAmount) * web3.LAMPORTS_PER_SOL);
      await program.methods
        .donate(amount)
        .accountsPartial({
          campaign: campaignPubkey,
          user: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();
      setStatus('Donated successfully!');
      setDonateAmount('');
      fetchCampaigns();
    } catch (e: any) {
      setStatus('Error: ' + e.message);
    }
    setLoading(false);
  };

  const withdraw = async (campaignPubkey: PublicKey) => {
    if (!wallet.connected || !wallet.publicKey) return setStatus('Please connect your wallet!');
    setLoading(true);
    setStatus('');
    try {
      const program = getProgram();
      const amount = new BN(0.1 * web3.LAMPORTS_PER_SOL);
      await program.methods
        .withdraw(amount)
        .accountsPartial({
          campaign: campaignPubkey,
          user: wallet.publicKey,
        })
        .rpc();
      setStatus('Withdrawn successfully!');
      fetchCampaigns();
    } catch (e: any) {
      setStatus('Error: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ margin: 0, color: '#9945FF' }}>🌊 Solana Crowdfunding</h1>
        <WalletMultiButton />
      </div>

      {status && (
        <div style={{ padding: 12, marginBottom: 16, background: status.includes('Error') ? '#ffe0e0' : '#e0ffe0', borderRadius: 8, color: '#333' }}>
          {status}
        </div>
      )}

      {wallet.connected && (
        <div style={{ background: '#f9f9f9', padding: 24, borderRadius: 12, marginBottom: 32 }}>
          <h2 style={{ marginTop: 0 }}>Create Campaign</h2>
          <input
            id="campaign-name"
            placeholder="Campaign name"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 6, border: '1px solid #ddd', boxSizing: 'border-box' }}
          />
          <textarea
            id="campaign-description"
            placeholder="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 6, border: '1px solid #ddd', boxSizing: 'border-box', height: 80 }}
          />
          <button
            onClick={createCampaign}
            disabled={loading}
            style={{ background: '#9945FF', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 6, cursor: 'pointer', fontSize: 16 }}
          >
            {loading ? 'Creating...' : 'Create Campaign'}
          </button>
        </div>
      )}

      <h2>Active Campaigns</h2>
      {!wallet.connected && <p style={{ color: '#666' }}>Connect your wallet to see campaigns</p>}
      {campaigns.length === 0 && wallet.connected && <p style={{ color: '#666' }}>No campaigns yet. Create one!</p>}

      {campaigns.map((campaign, i) => (
        <div key={i} style={{ background: 'white', border: '1px solid #eee', borderRadius: 12, padding: 24, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 8px', color: '#333' }}>{campaign.name}</h3>
          <p style={{ color: '#666', margin: '0 0 12px' }}>{campaign.description}</p>
          <p style={{ color: '#9945FF', fontWeight: 'bold', margin: '0 0 16px' }}>
            Raised: {(campaign.amountDonated / web3.LAMPORTS_PER_SOL).toFixed(4)} SOL
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              id={`donate-${i}`}
              placeholder="SOL amount"
              value={donateAmount}
              onChange={e => setDonateAmount(e.target.value)}
              style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd', width: 120 }}
            />
            <button
              onClick={() => donate(campaign.pubkey)}
              disabled={loading}
              style={{ background: '#14F195', color: '#000', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}
            >
              Donate
            </button>
            {wallet.publicKey?.toString() === campaign.admin.toString() && (
              <button
                onClick={() => withdraw(campaign.pubkey)}
                disabled={loading}
                style={{ background: '#FF6B6B', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}
              >
                Withdraw 0.1 SOL
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}