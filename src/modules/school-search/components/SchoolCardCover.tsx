import Image from 'next/image';

// Directory records do not expose a verified individual image. This is an existing
// product-owned decorative field image, deliberately empty-alt so it is never
// presented as a photo of the particular school.
function SchoolCardCover() {
  return (
    <div
      data-slot="school-card-image"
      className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted"
    >
      <Image
        fill
        alt=""
        sizes="96px"
        src="/brand/hero-field.webp"
        className="object-cover"
      />
    </div>
  );
}

export { SchoolCardCover };
