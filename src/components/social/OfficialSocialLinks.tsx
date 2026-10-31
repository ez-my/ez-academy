import { SiFacebook, SiInstagram, SiThreads, SiTiktok } from 'react-icons/si';

export const officialSocialAccounts = [
  { name: 'TikTok', url: 'https://www.tiktok.com/@ez.academy_official', icon: SiTiktok, label: 'Follow EZ Academy on TikTok' },
  { name: 'Threads', url: 'https://www.threads.com/@ezacademy.my', icon: SiThreads, label: 'Follow EZ Academy on Threads' },
  { name: 'Instagram', url: 'https://www.instagram.com/ezacademy.my', icon: SiInstagram, label: 'Follow EZ Academy on Instagram' },
  { name: 'Facebook', url: 'https://www.facebook.com/ezacademy.my', icon: SiFacebook, label: 'Follow EZ Academy on Facebook' },
] as const;

type Variant = 'sidebar' | 'support' | 'footer';

export function OfficialSocialLinks({ variant }: { variant: Variant }) {
  const isSupport = variant === 'support';
  return <nav aria-label="EZ Academy social media" className={isSupport ? 'grid grid-cols-2 sm:grid-cols-4 gap-3' : 'flex flex-wrap items-center gap-1'}>
    {officialSocialAccounts.map(({ name, url, icon: Icon, label }) =>
      <a key={name} href={url} target="_blank" rel="noopener noreferrer external" aria-label={`${label} (opens in a new tab)`} title={`${name} (opens in a new tab)`}
        className={isSupport
          ? 'min-h-14 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white/75 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
          : 'inline-flex h-11 w-11 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-white/5 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'}>
        <Icon aria-hidden="true" size={isSupport ? 19 : 18} />
        {isSupport && <span>{name}</span>}
      </a>
    )}
  </nav>;
}
