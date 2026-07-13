'use client';

import { zodResolver } from '@hookform/resolvers/zod';
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
import {
  ARTICLE_CATEGORIES,
  createArticleSchema,
  type CreateArticleInput,
} from '@/modules/articles/schemas/article.schema';

export function CreateArticleForm() {
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
      toast.success(`Created “${article.title}”`);
      form.reset();
    } catch {
      toast.error('Failed to create article');
    }
  });

  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="title">Title</FieldLabel>
          <Input id="title" {...form.register('title')} />
          {errors.title ? <FieldError>{errors.title.message}</FieldError> : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="slug">Slug</FieldLabel>
          <Input id="slug" placeholder="my-article" {...form.register('slug')} />
          {errors.slug ? <FieldError>{errors.slug.message}</FieldError> : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="category">Category</FieldLabel>
          <Select
            value={form.watch('category')}
            onValueChange={(value) =>
              form.setValue('category', value as CreateArticleInput['category'])
            }
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {ARTICLE_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category} className="capitalize">
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="excerpt">Excerpt</FieldLabel>
          <Textarea id="excerpt" rows={3} {...form.register('excerpt')} />
          {errors.excerpt ? <FieldError>{errors.excerpt.message}</FieldError> : null}
        </Field>

        <Button type="submit" disabled={isPending} className="w-fit">
          {isPending ? 'Creating…' : 'Create article'}
        </Button>
      </FieldGroup>
    </form>
  );
}
