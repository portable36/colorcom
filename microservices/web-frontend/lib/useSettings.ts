import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useSettings() {
  const { data, error, mutate } = useSWR('/api/admin/settings', fetcher, { revalidateOnFocus: false });
  return { settings: data, loading: !error && !data, error, mutate };
}
