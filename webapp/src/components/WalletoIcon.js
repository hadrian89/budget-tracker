import { CATEGORY_ICONS, ACCOUNT_ICONS, CATEGORY_NAME_MAP, FAMILY_STYLES } from '../data/icons';

const DEFAULT_FAMILY = 'primary';

export function getIconMeta(name) {
  const resolved = CATEGORY_NAME_MAP[name] || name;
  const icon = CATEGORY_ICONS[resolved] || ACCOUNT_ICONS[resolved];
  const family = icon?.family || DEFAULT_FAMILY;
  return { key: resolved, family, tileBg: FAMILY_STYLES[family].tileBg, icon };
}

export default function WalletoIcon({ name, size = 24, stroke = 'var(--primary)', className = '', style = {} }) {
  const { icon, family } = getIconMeta(name);

  if (!icon) {
    return (
      <span
        className={className}
        style={{ fontSize: size * 0.6, lineHeight: 1, display: 'inline-flex', alignItems: 'center', color: 'var(--on-surface-muted)', ...style }}
      >
        {name}
      </span>
    );
  }

  const fs = FAMILY_STYLES[family];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={{ '--fill-tint': fs.fillTint, '--accent': fs.accent, ...style }}
      aria-label={icon.label}
      dangerouslySetInnerHTML={{ __html: icon.svg(stroke) }}
    />
  );
}
