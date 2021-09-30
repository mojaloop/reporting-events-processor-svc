const config = require('../../src/config/config.js')

jest.mock('dotenv', () => ({
    config: () => { }
}));

describe('Load Config', () => {
    let consoleSpy;
    beforeEach(() => {
        consoleSpy = jest
            .spyOn(console, 'log')
    });

    afterEach(() => {
        consoleSpy.mockReset();
    })

    it('Config should load environment variables', async () => {
        const dotEnv = require('dotenv');
        const expectedResult = { prop1: 'SOME DEFAULT VALUES' };

        dotEnvConfigSpy = jest
            .spyOn(dotEnv, 'config')
            .mockImplementation((x) => ({ parsed: expectedResult }));

        config.initConfig();

        expect(dotEnvConfigSpy).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('Config Loaded: ', expectedResult);
    })

    it('Config should handle an error thrown when failed to load environment variables', async () => {
        const dotEnv = require('dotenv');
        const expectedErrorMessage = 'My Test Error';

        dotEnvConfigSpy = jest
            .spyOn(dotEnv, 'config')
            .mockImplementation((x) => ({
                error: new Error(expectedErrorMessage)
            }));


        try {
            config.initConfig();

        } catch (err) {
            expectedError = err;
        }

        expect(dotEnvConfigSpy).toHaveBeenCalled();
        expect(expectedError).toEqual(new Error(expectedErrorMessage))
        expect(consoleSpy).not.toHaveBeenCalled();
    })
})