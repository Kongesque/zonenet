import { cookies } from 'next/headers';
import { LivestreamView } from '@/components/livestream/livestream-view';

export default async function Page() {
    const cookieStore = await cookies();
    const colsCookie = cookieStore.get('livestream_cols');
    // Default to 3 if no cookie or invalid value
    const defaultGridCols = colsCookie ? parseInt(colsCookie.value, 10) : 3;
    const safeGridCols = isNaN(defaultGridCols) ? 3 : defaultGridCols;

    return (
        <LivestreamView defaultGridCols={safeGridCols} />
    );
}
