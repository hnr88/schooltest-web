'use client';

import { useQuery } from '@tanstack/react-query';

import { strapi, type StrapiCollectionResponse } from '@/lib/axios/strapi';
import { classStudentOptionSchema } from '@/modules/classes/schemas/class.schema';
import type { ClassStudentOption } from '@/modules/classes/types/classes.types';
import {
  CLASS_CHILDREN_QUERY_KEY,
  CLASS_STUDENT_PAGE_SIZE,
  CLASS_STUDENT_PAGE_LIMIT,
} from '@/modules/classes/constants/queries.constants';

interface StudentPage {
  data: unknown[];
  meta?: { pagination?: { pageCount?: number } };
}

/**
 * C-CHD-01: students of the caller's school, backing the edit-dialog student
 * picker. Fetched without a status filter so students already in the class
 * (including archived ones) stay checked and survive the PATCH replace
 * semantics.
 *
 * EVERY page is fetched, not just the first. C-CHD-01 caps pageSize at 100, and
 * this used to request a single page of 100 — so at a school with more than 100
 * students the picker silently omitted the rest and they could not be assigned
 * to a class at all. The omission was invisible: no count, no "load more", just
 * a short list. Schools past the cap are the normal case, not the edge one.
 */
async function fetchClassStudents(): Promise<ClassStudentOption[]> {
  const rows: unknown[] = [];
  let page = 1;
  let pageCount = 1;

  do {
    const res = await strapi.get<StrapiCollectionResponse<unknown>>('/api/schools/me/children', {
      params: { page, pageSize: CLASS_STUDENT_PAGE_SIZE },
    });
    const body = res.data as unknown as StudentPage;
    rows.push(...body.data);
    pageCount = body.meta?.pagination?.pageCount ?? 1;
    page += 1;
  } while (page <= pageCount && page <= CLASS_STUDENT_PAGE_LIMIT);

  return rows.map((row) => classStudentOptionSchema.parse(row));
}

export function useClassStudentsQuery(enabled: boolean) {
  return useQuery({ queryKey: CLASS_CHILDREN_QUERY_KEY, queryFn: fetchClassStudents, enabled });
}
