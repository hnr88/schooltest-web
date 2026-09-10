'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateArticleMutation } from '@/modules/articles/queries/use-create-article.mutation';
import { ARTICLE_CATEGORIES } from '@/modules/articles/constants/article.constants';
import {
  createArticleSchema,
  type CreateArticleInput,
} from '@/modules/articles/schemas/article.schema';

export function CreateArticleForm() {
  const t = useTranslations('Articles');
  const { mutateAsync, isPending } = useCreateArticleMutation();
  const form = useForm<CreateArticleInput>({
    resolver: zodResolver(createArticleSchema),
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: 'news',
      featured: false,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const article = await mutateAsync(values);
      toast.success(t('createdToast', { title: article.title }));
      form.reset();
    } catch {
      toast.error(t('createFailedToast'));
    }
  });

  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="title">{t('fieldTitle')}</FieldLabel>
          <Input id="title" {...form.register('title')} />
          {errors.title ? <FieldError>{errors.title.message}</FieldError> : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="slug">{t('fieldSlug')}</FieldLabel>
          <Input id="slug" placeholder={t('slugPlaceholder')} {...form.register('slug')} />
          {errors.slug ? <FieldError>{errors.slug.message}</FieldError> : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="category">{t('fieldCategory')}</FieldLabel>
          <Select
            value={form.watch('category')}
            onValueChange={(value) =>
              form.setValue('category', value as CreateArticleInput['category'])
            }
          >
            <SelectTrigger id="category">
              <SelectValue placeholder={t('categoryPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {ARTICLE_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category} className="capitalize">
                  {t(`category${category[0].toUpperCase()}${category.slice(1)}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="excerpt">{t('fieldExcerpt')}</FieldLabel>
          <Textarea id="excerpt" rows={3} {...form.register('excerpt')} />
          {errors.excerpt ? <FieldError>{errors.excerpt.message}</FieldError> : null}
        </Field>

        <Button type="submit" disabled={isPending} className="w-fit">
          {isPending ? t('submitPending') : t('submit')}
        </Button>
      </FieldGroup>
    </form>
  );
}
