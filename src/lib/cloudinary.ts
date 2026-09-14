/**
 * Cloudinary configs — single source of truth, read directly from here.
 *
 * ⚠️ THIS FILE CONTAINS API SECRETS. Never import it from a client
 * component ("use client") — secrets would ship to the browser.
 * - Server code: import from `./cloudinary.server` (upload with fallback).
 * - Browser code: import from `./upload` (uploads via POST /api/upload,
 *   the server tries slot 1 → 2 → 3 and returns the URL to save in DB).
 */

export interface CloudinarySlot {
  /** Label for logs (ONE / TWO / THREE …). */
  name: string;
  CLOUD_NAME: string;
  API_KEY: string;
  API_SECRET: string;
}

const CloudinaryConfig = {
  ONE: {
    CLOUD_NAME: 'xqewzivw',
    API_KEY: '951364561679124',
    API_SECRET: 'iI_gD0AAY7AiC_4I4ZWXycdhJUQ',
  },
  TWO: {
    CLOUD_NAME: 'xqewzivw',
    API_KEY: '951364561679124',
    API_SECRET: 'iI_gD0AAY7AiC_4I4ZWXycdhJUQ',
  },
  THREE: {
    CLOUD_NAME: 'xqewzivC',
    API_KEY: '951364561679126',
    API_SECRET: 'iI_gD0AAY7AiC_4I4ZWXycdYJUQ',
  },
  FOUR: {
    CLOUD_NAME: 'xqewzivC',
    API_KEY: '951364561679126',
    API_SECRET: 'iI_gD0AAY7AiC_4I4ZWXycdYJUQ',
  },
  FIVE: {
    CLOUD_NAME: 'xqewzivC',
    API_KEY: '951364561679126',
    API_SECRET: 'iI_gD0AAY7AiC_4I4ZWXycdYJUQ',
  },
  SIX: {
    CLOUD_NAME: 'xqewzivC',
    API_KEY: '951364561679126',
    API_SECRET: 'iI_gD0AAY7AiC_4I4ZWXycdYJUQ',
  },
};

/**
 * Upload fallback order: try the first slot, on failure the second,
 * then the third. Add more names here to extend the chain.
 */
export const CLOUDINARY_ORDER: Array<keyof typeof CloudinaryConfig> = ['ONE', 'TWO', 'THREE'];

export const CLOUDINARY_SLOTS: CloudinarySlot[] = CLOUDINARY_ORDER.map((name) => ({
  name,
  ...CloudinaryConfig[name],
}));

/** Shared upload limits (enforced in browser AND in /api/upload). */
export const CLOUDINARY_UPLOAD = {
  MAX_BYTES: 5 * 1024 * 1024, // 5 MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
} as const;

export default CloudinaryConfig;
