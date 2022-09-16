import * as dot from './dot'
import * as square from './square'
import * as lines from './lines'
import * as iso from './iso'

const patterns = [
  dot,
  square,
  lines,
  iso,
]

export default patterns;
export const defaultPatternProps = patterns.map(pattern => pattern.DEFAULT_PROPS);
