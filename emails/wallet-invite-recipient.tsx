import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface WalletInviteRecipientEmailProps {
  recipientName: string;
  senderName: string;
  senderUsername: string;
  walletSetupUrl?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://evento.cash';

export const WalletInviteRecipientEmail: React.FC<Readonly<WalletInviteRecipientEmailProps>> = ({
  recipientName,
  senderName,
  senderUsername,
  walletSetupUrl,
}) => {
  const setupUrl = walletSetupUrl || `${baseUrl}/e/wallet`;

  return (
    <Html lang='en' dir='ltr'>
      <Head />
      <Preview>{senderName} wants to send you sats on Evento</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>You have sats waiting!</Heading>

          <Text style={text}>Hi {recipientName},</Text>

          <Text style={text}>
            <strong>{senderName}</strong> (@{senderUsername}) tried to send you a Lightning zap on
            Evento, but you don&apos;t have a wallet set up yet.
          </Text>

          <Text style={text}>
            Set up your Evento Wallet in under a minute to start receiving Bitcoin Lightning
            payments from friends and event communities.
          </Text>

          <Section style={buttonSection}>
            <Button href={setupUrl} style={button}>
              Set Up Your Wallet
            </Button>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            Your wallet is self-custodial — only you control your funds. No minimum deposit
            required.
          </Text>

          <Text style={footer}>
            If you didn&apos;t expect this email, you can safely ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default WalletInviteRecipientEmail;

// --- Styles ---

const main: React.CSSProperties = {
  backgroundColor: '#f6f6f6',
  margin: '0 auto',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const container: React.CSSProperties = {
  backgroundColor: '#ffffff',
  margin: '40px auto',
  padding: '48px 32px',
  borderRadius: '8px',
  maxWidth: '480px',
};

const h1: React.CSSProperties = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '32px',
  margin: '0 0 24px',
};

const text: React.CSSProperties = {
  color: '#444444',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const buttonSection: React.CSSProperties = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button: React.CSSProperties = {
  backgroundColor: '#1a1a1a',
  color: '#ffffff',
  padding: '14px 28px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: '600',
  fontSize: '15px',
  display: 'inline-block',
};

const divider: React.CSSProperties = {
  borderColor: '#eeeeee',
  margin: '32px 0',
};

const footer: React.CSSProperties = {
  color: '#999999',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '0 0 8px',
};
