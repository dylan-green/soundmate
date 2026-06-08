// <top-artists> has no styling beyond the shared top-list base (its `.sub`
// already reserves a line for artists with no genres). Re-export the common
// styles so the element keeps the standard `import { styles } from './<name>-css'`.
export { topListStyles as styles } from '../common/top-list-css';
