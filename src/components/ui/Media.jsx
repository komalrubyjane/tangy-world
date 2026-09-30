import { useMediaSrc } from '../../hooks/useContent';

// <img>/<video> for content media: stored references (private bucket, 0029)
// are swapped for short-lived signed URLs; ordinary paths pass through.
// While resolving (or if the viewer may not see the file) a neutral box is
// shown instead of a broken image.
export const MediaImg = ({ src, alt = '', className = '', ...rest }) => {
  const url = useMediaSrc(src);
  if (!url) return <span aria-hidden="true" className={`block bg-black/20 ${className}`} />;
  return <img src={url} alt={alt} className={className} {...rest} />;
};

export const MediaVideo = ({ src, poster, className = '', children, ...rest }) => {
  const url = useMediaSrc(src);
  const posterUrl = useMediaSrc(poster);
  if (!url) return <span aria-hidden="true" className={`block bg-black ${className}`} />;
  return <video src={url.startsWith('/') ? encodeURI(url) : url} poster={posterUrl || undefined} className={className} {...rest}>{children}</video>;
};
