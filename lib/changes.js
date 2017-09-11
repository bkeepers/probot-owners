module.exports = class Changes {
  constructor (paths, ownersFile) {
    this.paths = paths
    this.ownersFile = ownersFile
  }

  get owners () {
    return Array.from(new Set(this.paths.reduce((result, path) => {
      return result.concat(this.ownersFile.for(path))
    }, [])))
  }
}
