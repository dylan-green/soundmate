// <top-tracks> has no styling beyond the shared top-list base (it previously
// kept a full divergent copy that silently drifted from it). Re-export the common
// styles so the element keeps the standard `import { styles } from './<name>-css'`
// and stays pixel-identical to every other top tab.
export { topListStyles as styles } from '../common/top-list-css';
