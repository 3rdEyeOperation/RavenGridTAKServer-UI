export interface TsAppVersion {
    version: string;
    name: string;
    description?: string;
    versionLong?: string;
    versionDate: string;
    gitCommitHash?: string;
    gitCommitDate?: string;
    gitTag?: string;
};
export const versions: TsAppVersion = {
    version: '0.0.0',
    name: 'opentakserver-ui',
    versionDate: '2025-12-26T03:01:36.249Z',
    gitCommitHash: 'g6208033',
    gitCommitDate: '2025-12-25T17:51:43.000Z',
    versionLong: '0.0.0-g6208033',
    gitTag: 'v1.7.1',
};
export default versions;
