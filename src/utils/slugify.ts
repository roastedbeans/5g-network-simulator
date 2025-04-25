import slugify from 'slugify';

/**
 * Converts a string to a URL-friendly slug
 * @param str The string to convert to a slug
 * @param options Options for the slugify function
 * @returns The slugified string
 */
export function createSlug(
	str: string,
	options?: {
		lower?: boolean;
		strict?: boolean;
		replacement?: string;
	}
): string {
	return slugify(str, {
		lower: true,
		strict: true,
		...options,
	});
}

// Re-export for convenience
export { slugify };
