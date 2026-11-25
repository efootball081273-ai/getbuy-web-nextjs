import assert from "node:assert/strict";
import test from "node:test";
import {
  createCloudinarySignature,
  hasSupportedImageSignature,
} from "../src/lib/cloudinary";

test("creates Cloudinary's SHA-1 request signature", () => {
  assert.equal(
    createCloudinarySignature("folder=products&timestamp=123", "secret"),
    "7a5114a0ed33fa6de24e840397dce316bf078b05",
  );
});

test("accepts supported image headers and rejects mismatched content types", () => {
  assert.equal(
    hasSupportedImageSignature("image/jpeg", Uint8Array.from([0xff, 0xd8, 0xff])),
    true,
  );
  assert.equal(
    hasSupportedImageSignature(
      "image/png",
      Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ),
    true,
  );
  assert.equal(
    hasSupportedImageSignature(
      "image/webp",
      Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]),
    ),
    true,
  );
  assert.equal(
    hasSupportedImageSignature("image/png", Uint8Array.from([0xff, 0xd8, 0xff])),
    false,
  );
  assert.equal(hasSupportedImageSignature("image/svg+xml", new Uint8Array(16)), false);
});
