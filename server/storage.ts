import { uploadedImages, layoutResults, presets, users, emailVerifications, type UploadedImage, type LayoutResult, type InsertUploadedImage, type InsertLayoutResult, type Preset, type InsertPreset, type User, type UpsertUser, type EmailVerification, type InsertEmailVerification } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gt } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  
  // Email verification operations
  saveEmailVerification(verification: InsertEmailVerification): Promise<EmailVerification>;
  getEmailVerification(email: string, code: string): Promise<EmailVerification | undefined>;
  markEmailVerificationAsUsed(id: string): Promise<void>;
  deleteExpiredVerifications(): Promise<void>;
  
  // Image operations
  saveUploadedImage(image: InsertUploadedImage): Promise<UploadedImage>;
  getUploadedImage(id: string): Promise<UploadedImage | undefined>;
  updateUploadedImage(id: string, updates: Partial<UploadedImage>): Promise<UploadedImage>;
  getUserImages(userId: string): Promise<UploadedImage[]>;
  
  // Layout operations
  saveLayoutResult(result: InsertLayoutResult): Promise<LayoutResult>;
  getLayoutResult(imageId: string): Promise<LayoutResult | undefined>;
  getLayoutResultById(id: string): Promise<LayoutResult | undefined>;
  deleteUploadedImage(id: string): Promise<void>;
  
  // Preset methods
  getAllPresets(userId?: string): Promise<Preset[]>;
  savePreset(preset: InsertPreset): Promise<Preset>;
  deletePreset(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const id = userData.id || randomUUID();
    const [user] = await db
      .insert(users)
      .values({ ...userData, id })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Email verification operations
  async saveEmailVerification(verification: InsertEmailVerification): Promise<EmailVerification> {
    const id = randomUUID();
    const [emailVerification] = await db
      .insert(emailVerifications)
      .values({ ...verification, id })
      .returning();
    return emailVerification;
  }

  async getEmailVerification(email: string, code: string): Promise<EmailVerification | undefined> {
    const [verification] = await db
      .select()
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.email, email),
          eq(emailVerifications.verificationCode, code),
          eq(emailVerifications.used, false),
          gt(emailVerifications.expiresAt, new Date())
        )
      );
    return verification;
  }

  async markEmailVerificationAsUsed(id: string): Promise<void> {
    await db
      .update(emailVerifications)
      .set({ used: true })
      .where(eq(emailVerifications.id, id));
  }

  async deleteExpiredVerifications(): Promise<void> {
    await db
      .delete(emailVerifications)
      .where(
        and(
          eq(emailVerifications.used, false),
          eq(emailVerifications.expiresAt, new Date())
        )
      );
  }
  async saveUploadedImage(image: InsertUploadedImage): Promise<UploadedImage> {
    const id = randomUUID();
    const [uploadedImage] = await db
      .insert(uploadedImages)
      .values({ ...image, id })
      .returning();
    return uploadedImage;
  }

  async getUploadedImage(id: string): Promise<UploadedImage | undefined> {
    const [image] = await db.select().from(uploadedImages).where(eq(uploadedImages.id, id));
    return image || undefined;
  }

  async updateUploadedImage(id: string, updates: Partial<UploadedImage>): Promise<UploadedImage> {
    const [updatedImage] = await db
      .update(uploadedImages)
      .set(updates)
      .where(eq(uploadedImages.id, id))
      .returning();
    return updatedImage;
  }

  async saveLayoutResult(result: InsertLayoutResult): Promise<LayoutResult> {
    const id = randomUUID();
    const [layoutResult] = await db
      .insert(layoutResults)
      .values({
        id,
        imageId: result.imageId,
        settings: result.settings,
        cropSettings: result.cropSettings || null,
        photosPerRow: result.photosPerRow,
        totalRows: result.totalRows,
        pageUtilization: result.pageUtilization,
        processedImageUrl: result.processedImageUrl,
        borderWidth: result.borderWidth ?? 0
      } as any)
      .returning();
    return layoutResult;
  }

  async getLayoutResult(imageId: string): Promise<LayoutResult | undefined> {
    const layouts = await db.select().from(layoutResults).where(eq(layoutResults.imageId, imageId)).orderBy(desc(layoutResults.id));
    return layouts[0] || undefined;
  }

  async getLayoutResultById(id: string): Promise<LayoutResult | undefined> {
    const [layout] = await db.select().from(layoutResults).where(eq(layoutResults.id, id));
    return layout || undefined;
  }

  async deleteUploadedImage(id: string): Promise<void> {
    // Delete layout results first due to foreign key constraint
    await db.delete(layoutResults).where(eq(layoutResults.imageId, id));
    // Delete the image
    await db.delete(uploadedImages).where(eq(uploadedImages.id, id));
  }

  async getUserImages(userId: string): Promise<UploadedImage[]> {
    return await db.select().from(uploadedImages)
      .where(eq(uploadedImages.userId, userId))
      .orderBy(desc(uploadedImages.uploadedAt));
  }

  async getAllPresets(userId?: string): Promise<Preset[]> {
    if (userId) {
      return await db.select().from(presets)
        .where(eq(presets.userId, userId))
        .orderBy(presets.createdAt);
    }
    return await db.select().from(presets).orderBy(presets.createdAt);
  }

  async savePreset(preset: InsertPreset): Promise<Preset> {
    const id = randomUUID();
    const [savedPreset] = await db
      .insert(presets)
      .values({
        id,
        userId: preset.userId,
        name: preset.name,
        description: preset.description || null,
        settings: preset.settings,
        borderWidth: preset.borderWidth ?? 0
      } as any)
      .returning();
    return savedPreset;
  }

  async deletePreset(id: string): Promise<void> {
    await db.delete(presets).where(eq(presets.id, id));
  }
}

export const storage = new DatabaseStorage();
