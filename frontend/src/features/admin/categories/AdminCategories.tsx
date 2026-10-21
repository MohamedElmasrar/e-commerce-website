"use client";

import { CheckSquare, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormField } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { readFormError } from "@/features/shared/form-errors";
import { useDeleteCategory, useSaveCategory } from "@/hooks/useAdminCategories";
import { useCategories } from "@/hooks/useCategories";
import type { CategoryResponse } from "@/lib/api/types";
import { LoadError, LoadingBox, PageHeader } from "../components/AdminShared";
import {
  CATEGORY_FIELDS,
  emptyCategoryForm,
  slugify,
  toCategoryRequest,
  validateCategoryForm,
  type CategoryErrors,
  type CategoryFormValues,
} from "./validation";

function flatten(categories: CategoryResponse[], depth = 0): { category: CategoryResponse; depth: number }[] {
  return categories.flatMap((category) => [{ category, depth }, ...flatten(category.children, depth + 1)]);
}

function descendantIds(category: CategoryResponse): number[] {
  return category.children.flatMap((child) => [child.id, ...descendantIds(child)]);
}

interface EditorProps {
  editing: CategoryResponse | null;
  rows: { category: CategoryResponse; depth: number }[];
  onClose: () => void;
}

function CategoryEditor({ editing, rows, onClose }: EditorProps) {
  const toast = useToast();
  const save = useSaveCategory();
  const [values, setValues] = useState<CategoryFormValues>(
    editing
      ? { name: editing.name, slug: editing.slug, description: editing.description ?? "", parentId: editing.parentId ? String(editing.parentId) : "" }
      : emptyCategoryForm,
  );
  const [slugTouched, setSlugTouched] = useState(editing !== null);
  const [errors, setErrors] = useState<CategoryErrors>({});
  const [general, setGeneral] = useState<string>();
  const blocked = new Set(editing ? [editing.id, ...descendantIds(editing)] : []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateCategoryForm(values);
    setErrors(found);
    setGeneral(undefined);
    if (Object.keys(found).length > 0) return;
    save.mutate(
      { id: editing?.id ?? null, payload: toCategoryRequest(values) },
      {
        onSuccess: () => {
          toast.success(editing ? "Category saved" : "Category created");
          onClose();
        },
        onError: (failure) => {
          const parsed = readFormError(failure, CATEGORY_FIELDS);
          setErrors(parsed.fields);
          setGeneral(parsed.general);
        },
      },
    );
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="modal-header">
        <h2 className="font-medium text-base mr-auto">{editing ? "Edit category" : "New category"}</h2>
      </div>
      <div className="modal-body">
        {general ? (
          <div className="alert alert-danger mb-4" role="alert">
            {general}
          </div>
        ) : null}
        <FormField id="category-name" label="Name" error={errors.name}>
          <input
            id="category-name"
            className="form-control"
            value={values.name}
            onChange={(event) =>
              setValues((v) => ({ ...v, name: event.target.value, slug: slugTouched ? v.slug : slugify(event.target.value) }))
            }
          />
        </FormField>
        <div className="mt-3">
          <FormField id="category-slug" label="Slug" error={errors.slug}>
            <input
              id="category-slug"
              className="form-control"
              value={values.slug}
              onChange={(event) => {
                setSlugTouched(true);
                setValues((v) => ({ ...v, slug: event.target.value }));
              }}
            />
          </FormField>
        </div>
        <div className="mt-3">
          <FormField id="category-parent" label="Parent category" error={errors.parentId}>
            <select
              id="category-parent"
              className="form-select"
              value={values.parentId}
              onChange={(event) => setValues((v) => ({ ...v, parentId: event.target.value }))}
            >
              <option value="">None (top level)</option>
              {rows
                .filter(({ category }) => !blocked.has(category.id))
                .map(({ category, depth }) => (
                  <option key={category.id} value={category.id}>
                    {`${"\u00A0\u00A0".repeat(depth)}${category.name}`}
                  </option>
                ))}
            </select>
          </FormField>
        </div>
        <div className="mt-3">
          <FormField id="category-description" label="Description" error={errors.description}>
            <textarea
              id="category-description"
              className="form-control"
              rows={3}
              value={values.description}
              onChange={(event) => setValues((v) => ({ ...v, description: event.target.value }))}
            />
          </FormField>
        </div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-outline-secondary w-20 mr-1" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary w-20" disabled={save.isPending}>
          {save.isPending ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

export function AdminCategories() {
  const toast = useToast();
  const { data, isPending, isError, refetch } = useCategories(false);
  const remove = useDeleteCategory();
  const [editor, setEditor] = useState<{ category: CategoryResponse | null; key: number } | null>(null);
  const [deleting, setDeleting] = useState<CategoryResponse | null>(null);
  const rows = flatten(data ?? []);

  return (
    <>
      <PageHeader title="Categories">
        <button type="button" className="btn btn-primary shadow-md" onClick={() => setEditor({ category: null, key: Date.now() })}>
          Add New Category
        </button>
      </PageHeader>
      {isPending ? <LoadingBox /> : null}
      {isError ? <LoadError message="Categories could not be loaded." onRetry={() => refetch()} /> : null}
      {data ? (
        <div className="intro-y overflow-auto lg:overflow-visible mt-5">
          <table className="table table-report -mt-2">
            <thead>
              <tr>
                <th className="whitespace-nowrap">CATEGORY</th>
                <th className="whitespace-nowrap">SLUG</th>
                <th className="text-center whitespace-nowrap">PRODUCTS</th>
                <th className="text-center whitespace-nowrap">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-slate-500 py-10">
                    No categories yet.
                  </td>
                </tr>
              ) : null}
              {rows.map(({ category, depth }) => (
                <tr key={category.id} className="intro-x">
                  <td>
                    <span className="font-medium whitespace-nowrap" style={{ paddingLeft: depth * 24 }}>
                      {category.name}
                    </span>
                  </td>
                  <td className="text-slate-500">{category.slug}</td>
                  <td className="text-center">{category.productCount}</td>
                  <td className="table-report__action w-56">
                    <div className="flex justify-center items-center">
                      <button type="button" className="flex items-center mr-3" onClick={() => setEditor({ category, key: category.id })}>
                        <CheckSquare className="w-4 h-4 mr-1" /> Edit
                      </button>
                      <button type="button" className="flex items-center text-danger" onClick={() => setDeleting(category)}>
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <Modal open={editor !== null} onClose={() => setEditor(null)} label="Category">
        {editor ? <CategoryEditor key={editor.key} editing={editor.category} rows={rows} onClose={() => setEditor(null)} /> : null}
      </Modal>
      <ConfirmDialog
        open={deleting !== null}
        title="Delete this category?"
        message={deleting ? `"${deleting.name}" will be deleted. Categories that still contain products or subcategories cannot be deleted.` : undefined}
        busy={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting.id, {
            onSuccess: () => toast.success("Category deleted"),
            onSettled: () => setDeleting(null),
          });
        }}
      />
    </>
  );
}
