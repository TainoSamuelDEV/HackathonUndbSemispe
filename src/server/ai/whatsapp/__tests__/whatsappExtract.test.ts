import { describe, expect, it } from 'vitest';
import {
  extractWhatsAppMessageContent,
  isUserWhatsAppJid,
  resolveRemoteJid,
} from '@/server/ai/whatsapp/whatsappExtract';

describe('whatsappExtract', () => {
  it('resolve @lid usando remoteJidAlt e filtra grupos/broadcast/newsletter', () => {
    const resolved = resolveRemoteJid('123456@lid', '5598991234567@s.whatsapp.net');
    expect(resolved).toBe('5598991234567@s.whatsapp.net');
    expect(isUserWhatsAppJid(resolved)).toBe(true);
    expect(isUserWhatsAppJid('120363000000@g.us')).toBe(false);
    expect(isUserWhatsAppJid('status@broadcast')).toBe(false);
    expect(isUserWhatsAppJid('123@newsletter')).toBe(false);
    expect(isUserWhatsAppJid('123456@lid')).toBe(false);
  });

  it('desempacota ephemeralMessage, viewOnceMessageV2 e documentWithCaptionMessage', () => {
    const ephemeral = extractWhatsAppMessageContent({
      ephemeralMessage: {
        message: { extendedTextMessage: { text: 'Quero atualizar meu currículo' } },
      },
    });
    expect(ephemeral.mediaKind).toBe('TEXTO');
    expect(ephemeral.text).toBe('Quero atualizar meu currículo');

    const viewOnceImg = extractWhatsAppMessageContent({
      viewOnceMessageV2: {
        message: {
          imageMessage: {
            mimetype: 'image/png',
            caption: 'Meu certificado NR-12',
          },
        },
      },
    });
    expect(viewOnceImg.mediaKind).toBe('IMAGEM');
    expect(viewOnceImg.mimeType).toBe('image/png');
    expect(viewOnceImg.caption).toBe('Meu certificado NR-12');

    const docWithCaption = extractWhatsAppMessageContent({
      documentWithCaptionMessage: {
        message: {
          documentMessage: {
            mimetype: 'application/pdf',
            fileName: 'cv_joao.pdf',
            caption: 'Segue meu currículo antigo',
          },
        },
      },
    });
    expect(docWithCaption.mediaKind).toBe('DOCUMENTO');
    expect(docWithCaption.fileName).toBe('cv_joao.pdf');
    expect(docWithCaption.caption).toBe('Segue meu currículo antigo');
  });
});
