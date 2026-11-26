export type EvolutionMediaMessage = {
  mimetype?: string;
  caption?: string;
  fileName?: string;
  title?: string;
  base64?: string;
};

export type EvolutionRawMessage = {
  conversation?: string;
  extendedTextMessage?: { text?: string };
  ephemeralMessage?: { message?: EvolutionRawMessage };
  viewOnceMessageV2?: { message?: EvolutionRawMessage };
  viewOnceMessage?: { message?: EvolutionRawMessage };
  documentWithCaptionMessage?: { message?: EvolutionRawMessage };
  audioMessage?: EvolutionMediaMessage;
  pttMessage?: EvolutionMediaMessage;
  imageMessage?: EvolutionMediaMessage;
  documentMessage?: EvolutionMediaMessage;
  base64?: string;
};

export type EvolutionWebhookPayload = {
  event?: string;
  instance?: string;
  apikey?: string;
  data?: {
    key?: {
      remoteJid?: string;
      remoteJidAlt?: string;
      fromMe?: boolean;
      id?: string;
    };
    pushName?: string;
    messageType?: string;
    base64?: string;
    message?: EvolutionRawMessage;
  };
};

export type TipoMidiaExtraida = 'TEXTO' | 'AUDIO' | 'DOCUMENTO' | 'IMAGEM';

export interface ExtractedWhatsAppMessage {
  text: string;
  caption: string;
  mediaKind: TipoMidiaExtraida;
  mimeType?: string;
  fileName?: string;
  inlineBase64?: string;
}

/**
 * Resolve o JID real do usuário quando a Evolution API envia @lid acompanhado de remoteJidAlt.
 */
export function resolveRemoteJid(rawJid?: string, remoteJidAlt?: string): string {
  const jid = (rawJid ?? '').trim();
  if (!jid) return '';
  if (jid.endsWith('@lid') && remoteJidAlt?.trim()) {
    return remoteJidAlt.trim();
  }
  return jid;
}

/**
 * Aceita apenas conversas individuais (@s.whatsapp.net ou número puro vindo do simulador web).
 * Rejeita grupos (@g.us), status/listas (@broadcast), canais (@newsletter) e @lid sem alternativa.
 */
export function isUserWhatsAppJid(remoteJid: string): boolean {
  const jid = remoteJid.trim().toLowerCase();
  if (!jid) return false;
  if (
    jid.endsWith('@g.us') ||
    jid.endsWith('@broadcast') ||
    jid.endsWith('@newsletter') ||
    jid.endsWith('@lid')
  ) {
    return false;
  }
  if (jid.endsWith('@s.whatsapp.net')) {
    return jid.replace('@s.whatsapp.net', '').replace(/\D/g, '').length >= 10;
  }
  return /^\d{10,15}$/.test(jid);
}

function unwrapRawMessage(rawMessage?: EvolutionRawMessage): EvolutionRawMessage | undefined {
  let current = rawMessage;
  for (let depth = 0; depth < 4 && current; depth += 1) {
    const nested =
      current.ephemeralMessage?.message ||
      current.viewOnceMessageV2?.message ||
      current.viewOnceMessage?.message ||
      current.documentWithCaptionMessage?.message;
    if (!nested) break;
    current = nested;
  }
  return current;
}

/**
 * Desempacota mensagens da Evolution API suportando texto simples, textos estendidos,
 * mensagens temporárias (ephemeral), visualização única (viewOnce), áudio, imagem e documento.
 */
export function extractWhatsAppMessageContent(
  rawMessage?: EvolutionRawMessage,
  messageType?: string,
  rootBase64?: string
): ExtractedWhatsAppMessage {
  const target = unwrapRawMessage(rawMessage);
  if (!target || typeof target !== 'object') {
    const isAudioType = messageType === 'audioMessage' || messageType === 'pttMessage';
    const isImageType = messageType === 'imageMessage';
    const isDocType =
      messageType === 'documentMessage' || messageType === 'documentWithCaptionMessage';
    return {
      text: '',
      caption: '',
      mediaKind: isAudioType ? 'AUDIO' : isImageType ? 'IMAGEM' : isDocType ? 'DOCUMENTO' : 'TEXTO',
      inlineBase64: rootBase64,
    };
  }

  const audioMsg = target.audioMessage ?? target.pttMessage;
  const imageMsg = target.imageMessage;
  const docMsg = target.documentMessage;

  const textBody =
    (typeof target.conversation === 'string' && target.conversation) ||
    (typeof target.extendedTextMessage?.text === 'string' && target.extendedTextMessage.text) ||
    '';

  const caption =
    (typeof imageMsg?.caption === 'string' && imageMsg.caption) ||
    (typeof docMsg?.caption === 'string' && docMsg.caption) ||
    '';

  if (audioMsg || messageType === 'audioMessage' || messageType === 'pttMessage') {
    return {
      text: textBody.trim(),
      caption: '',
      mediaKind: 'AUDIO',
      mimeType: String(audioMsg?.mimetype ?? 'audio/ogg').split(';')[0].trim().toLowerCase(),
      inlineBase64: audioMsg?.base64 || target.base64 || rootBase64,
    };
  }

  if (docMsg || messageType === 'documentMessage' || messageType === 'documentWithCaptionMessage') {
    return {
      text: (textBody || caption).trim(),
      caption: caption.trim(),
      mediaKind: 'DOCUMENTO',
      mimeType: String(docMsg?.mimetype ?? 'application/pdf').split(';')[0].trim().toLowerCase(),
      fileName: docMsg?.fileName || docMsg?.title,
      inlineBase64: docMsg?.base64 || target.base64 || rootBase64,
    };
  }

  if (imageMsg || messageType === 'imageMessage') {
    return {
      text: (textBody || caption).trim(),
      caption: caption.trim(),
      mediaKind: 'IMAGEM',
      mimeType: String(imageMsg?.mimetype ?? 'image/jpeg').split(';')[0].trim().toLowerCase(),
      inlineBase64: imageMsg?.base64 || target.base64 || rootBase64,
    };
  }

  return {
    text: textBody.trim(),
    caption: '',
    mediaKind: 'TEXTO',
  };
}
