/**
 * @file models/client.model.ts
 * @description Client (billing customer) Mongoose schema.
 *
 * Virtuals:  maskedEmail, displayLabel
 * Indexes:
 *   - name          (unique, case-insensitive)
 *   - contactEmail  (sparse unique)
 *   - isActive      (partial)
 */

import { Schema, model, type Model, type HydratedDocument } from "mongoose";
import { baseSchemaOptions } from "./helpers";

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

export interface IClient {
  name: string;
  contactName: string;
  contactEmail: string;
  billingRate: number; // default hourly billing rate for this client
  currency: string; // ISO 4217, e.g. "USD"
  address: string;
  notes: string;
  isActive: boolean;
}

export interface IClientVirtuals {
  /** "Acme Corp — john@acme.com" */
  displayLabel: string;
  /** "j***n@acme.com" */
  maskedEmail: string;
}

export type ClientDocument = HydratedDocument<
  IClient,
  Record<string, never>,
  IClientVirtuals
>;
export type ClientModel = Model<
  IClient,
  Record<string, never>,
  Record<string, never>,
  IClientVirtuals
>;

// ─── Schema ───────────────────────────────────────────────────────────────────

const clientSchema = new Schema<
  IClient,
  ClientModel,
  Record<string, never>,
  Record<string, never>,
  IClientVirtuals
>(
  {
    name: {
      type: String,
      required: [true, "Client name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [150, "Name must be at most 150 characters"],
    },
    contactName: {
      type: String,
      trim: true,
      default: "",
      maxlength: [100, "Contact name must be at most 100 characters"],
    },
    contactEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
      match: [/^\S+@\S+\.\S+$/, "Must be a valid email address"],
    },
    billingRate: {
      type: Number,
      min: [0, "Billing rate cannot be negative"],
      default: 0,
    },
    currency: {
      type: String,
      uppercase: true,
      trim: true,
      default: "USD",
      match: [
        /^[A-Z]{3}$/,
        "Currency must be a valid ISO 4217 code (e.g. USD)",
      ],
    },
    address: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Address must be at most 500 characters"],
    },
    notes: {
      type: String,
      trim: true,
      default: "",
      maxlength: [2000, "Notes must be at most 2000 characters"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  baseSchemaOptions(),
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Unique client name, case-insensitive
clientSchema.index(
  { name: 1 },
  {
    unique: true,
    name: "idx_client_name_unique",
    collation: { locale: "en", strength: 2 },
  },
);

// Sparse unique email — allows empty string / multiple "no email" clients
clientSchema.index(
  { contactEmail: 1 },
  {
    name: "idx_client_email",
    sparse: true,
    unique: true,
    partialFilterExpression: { contactEmail: { $gt: "" } },
  },
);

// Partial index for active-only queries
clientSchema.index(
  { isActive: 1 },
  { name: "idx_client_active", partialFilterExpression: { isActive: true } },
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────

clientSchema.virtual("displayLabel").get(function (
  this: ClientDocument,
): string {
  return this.contactEmail ? `${this.name} — ${this.contactEmail}` : this.name;
});

clientSchema.virtual("maskedEmail").get(function (
  this: ClientDocument,
): string {
  if (!this.contactEmail) return "";
  const [local, domain] = this.contactEmail.split("@");
  if (!local || !domain) return this.contactEmail;
  const masked =
    local.length <= 2
      ? `${local[0]}***`
      : `${local[0]}${"*".repeat(local.length - 2)}${local[local.length - 1]}`;
  return `${masked}@${domain}`;
});

// ─── Model ────────────────────────────────────────────────────────────────────

export const Client = model<IClient, ClientModel>("Client", clientSchema);
