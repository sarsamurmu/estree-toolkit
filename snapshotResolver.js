module.exports = {
  resolveSnapshotPath: (testPath, snapshotExtension) => {
    return testPath.replace(/__tests__(\\|\/)/, 'tests$1snapshots$1') + snapshotExtension
  },
  resolveTestPath: (snapshotFilePath, snapshotExtension) => {
    return snapshotFilePath.replace(/tests(\\|\/)snapshots/, '__tests__').replace(snapshotExtension, '')
  },
  testPathForConsistencyCheck: '\\estree-toolkit\\__tests__\\scope.test.js',
}
