"use client";

import { ImagePlus, X } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { useToast } from "@/components/ui/Toast";
import { useDeleteProductImage, useUploadProductImage } from "@/hooks/useAdminProducts";
import type { ProductImage } from "@/lib/api/types";
import { describeMutationError } from "@/lib/query/mutation-errors";
import { resolveImageUrl } from "@/lib/utils/images";
import { IMAGE_TYPES, validateImageFile } from "./validation";

export interface PendingImage {
  file: File;
  preview: string;
}

/** Picks files, validates them and returns the accepted ones (shared by both modes). */
function useFilePicker(onAccepted: (files: File[]) => void, busy: boolean) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const accept = (list: FileList | null) => {
    if (busy) return;
    const accepted: File[] = [];
    for (const file of Array.from(list ?? [])) {
      const problem = validateImageFile(file);
      if (problem) toast.error("Image rejected", problem);
      else accepted.push(file);
    }
    if (accepted.length > 0) onAccepted(accepted);
    if (input.current) input.current.value = "";
  };

  const dropZone = (
    <div
      className={`border-2 border-dashed dark:border-darkmode-400 rounded-md pt-4 ${dragging ? "bg-slate-100" : ""}`}
      onDragOver={(event: DragEvent) => {
        event.preventDefault();
        if (!busy) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event: DragEvent) => {
        event.preventDefault();
        setDragging(false);
        accept(event.dataTransfer.files);
      }}
    >
      <div className="px-4 pb-4 flex items-center justify-center cursor-pointer relative" onClick={() => input.current?.click()}>
        <ImagePlus className="w-4 h-4 mr-2" />
        <span className="text-primary mr-1">Upload images</span> or drag and drop
        <input
          ref={input}
          type="file"
          multiple
          disabled={busy}
          accept={IMAGE_TYPES.join(",")}
          className="sr-only"
          aria-label="Choose product images"
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => accept(event.target.files)}
        />
      </div>
      <div className="text-xs text-slate-500 text-center pb-3">JPEG, PNG or WebP, up to 5 MB each</div>
    </div>
  );
  return dropZone;
}

function Thumb({ src, alt, onRemove, busy }: { src: string; alt: string; onRemove: () => void; busy?: boolean }) {
  return (
    <div className="w-24 h-24 relative image-fit mb-5 mr-5 cursor-pointer zoom-in">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="rounded-md" alt={alt} src={src} />
      <button
        type="button"
        title="Remove this image?"
        aria-label={`Remove ${alt}`}
        disabled={busy}
        onClick={onRemove}
        className="tooltip w-5 h-5 flex items-center justify-center absolute rounded-full text-white bg-danger right-0 top-0 -mr-2 -mt-2"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/** Edit mode: uploads straight to the product and deletes stored images. */
export function SavedImages({ productId, images }: { productId: number; images: ProductImage[] }) {
  const toast = useToast();
  const upload = useUploadProductImage(productId);
  const remove = useDeleteProductImage(productId);
  const [uploading, setUploading] = useState(false);
  const picker = useFilePicker(async (files) => {
    setUploading(true);
    let uploaded = 0;

    // Sequential: each response is the full product and the backend numbers the positions.
    try {
      for (const file of files) {
        await upload.mutateAsync(file);
        uploaded++;
      }
      toast.success(uploaded === 1 ? "Image uploaded" : `${uploaded} images uploaded`);
    } catch (error) {
      const { message } = describeMutationError(error);
      toast.error("Image upload stopped", `${uploaded} of ${files.length} images uploaded. ${message ?? "Try again."}`);
    } finally {
      setUploading(false);
    }
  }, uploading || remove.isPending);

  return (
    <div>
      <div className="flex flex-wrap mt-2">
        {[...images]
          .sort((a, b) => a.position - b.position)
          .map((image, index) => (
            <Thumb
              key={image.id}
              src={resolveImageUrl(image.url)}
              alt={`image ${index + 1}`}
              busy={uploading || remove.isPending}
              onRemove={() => remove.mutate(image.id, { onSuccess: () => toast.success("Image deleted") })}
            />
          ))}
      </div>
      {uploading ? <div className="text-slate-500 text-sm mb-2" role="status">Uploading images...</div> : null}
      {picker}
    </div>
  );
}

/** Create mode: files are previewed locally and uploaded after the product exists. */
export function PendingImages({ images, onChange, busy }: { images: PendingImage[]; onChange: (next: PendingImage[]) => void; busy: boolean }) {
  const picker = useFilePicker((files) =>
    onChange([...images, ...files.map((file) => ({ file, preview: URL.createObjectURL(file) }))]), busy,
  );
  return (
    <div>
      <div className="flex flex-wrap mt-2">
        {images.map((image) => (
          <Thumb
            key={image.preview}
            src={image.preview}
            alt={image.file.name}
            busy={busy}
            onRemove={() => {
              URL.revokeObjectURL(image.preview);
              onChange(images.filter((i) => i !== image));
            }}
          />
        ))}
      </div>
      {picker}
    </div>
  );
}

