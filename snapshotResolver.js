module.exports = {
  resolveSnapshotPath: (testPath, snapshotExtension) => {
    return testPath.replace(/__tests__(\\|\/)tests(\\|\/)src(\\|\/)/, 'tests$1snapshots$1') + snapshotExtension
  },
  resolveTestPath: (snapshotFilePath, snapshotExtension) => {
    return snapshotFilePath.replace(/tests(\\|\/)snapshots/, (_, sep) => `__tests__${sep}tests${sep}src`).replace(snapshotExtension, '')
  },
  testPathForConsistencyCheck: '\\estree-toolkit\\__tests__\\tests\\src\\scope.test.js',
}
