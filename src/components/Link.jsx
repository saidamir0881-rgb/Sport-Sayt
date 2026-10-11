import { Link as RouterLink } from 'react-router-dom';

// Next.js'dagi <Link href> bilan bir xil interfeys
export default function Link({ href, ...props }) {
  return <RouterLink to={href} {...props} />;
}
