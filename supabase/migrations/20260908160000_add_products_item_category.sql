-- Migration: Add 'Products' to item_category enum for perfumes, cosmetics, and personal care products
ALTER TYPE public.item_category ADD VALUE IF NOT EXISTS 'Products';
