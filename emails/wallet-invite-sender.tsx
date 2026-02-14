import { Body, Container, Head, Heading, Hr, Html, Preview, Text } from '@react-email/components';
import * as React from 'react';

interface WalletInviteSenderEmailProps {
  senderName: string;
  recipientName: string;
  recipientUsername: string;
}

export const WalletInviteSenderEmail: React.FC<Readonly<WalletInviteSenderEmailProps>> = ({
  senderName,
  recipientName,
  recipientUsername,
}) => {
  return (
    <Html lang='en' dir='ltr'>
      <Head />
      <Preview>We&apos;ve notified {recipientName} about Evento Wallet</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Notification Sent</Heading>

          <Text style={text}>Hi {senderName},</Text>

          <Text style={text}>
            We&apos;ve sent <strong>{recipientName}</strong> (@{recipientUsername}) an email letting
            them know you tried to send them a Lightning zap on Evento.
          </Text>

          <Text style={text}>Here&apos;s what happens next:</Text>

          <Text style={listItem}>
            1. {recipientName} receives an email inviting them to set up their Evento Wallet.
          </Text>
          <Text style={listItem}>
            2. Once they activate their wallet, they&apos;ll have a Lightning address.
          </Text>
          <Text style={listItem}>
            3. You&apos;ll be able to zap them directly from their profile or any event.
          </Text>

          <Hr style={divider} />

          <Text style={footer}>
            You won&apos;t be notified again for this recipient in the next 24 hours.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default WalletInviteSenderEmail;

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

const listItem: React.CSSProperties = {
  color: '#444444',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 8px',
  paddingLeft: '8px',
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
