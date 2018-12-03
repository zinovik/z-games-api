import { Container } from 'typedi';
import { Connection } from 'typeorm';

import { Log } from '../../src/api/models/Log';
import { LogService } from '../../src/api/services/LogService';
import { closeDatabase, createDatabaseConnection, migrateDatabase } from '../utils/database';
import { configureLogger } from '../utils/logger';

describe('LogService', () => {

    // -------------------------------------------------------------------------
    // Setup up
    // -------------------------------------------------------------------------

    let connection: Connection;
    beforeAll(async () => {
        configureLogger();
        connection = await createDatabaseConnection();
    });
    beforeEach(() => migrateDatabase(connection));

    // -------------------------------------------------------------------------
    // Tear down
    // -------------------------------------------------------------------------

    afterAll(() => closeDatabase(connection));

    // -------------------------------------------------------------------------
    // Test cases
    // -------------------------------------------------------------------------

    test('should create a new log in the database', async (done) => {
        const log = new Log();
        log.id = 'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx';
        log.text = 'test';
        log.type = 'move';
        log.game = '1';
        const service = Container.get<LogService>(LogService);
        const resultCreate = await service.create(log);
        expect(resultCreate.text).toBe(log.text);

        const resultFind = await service.findOne(resultCreate.id);
        if (resultFind) {
            expect(resultFind.text).toBe(log.text);
        } else {
            fail('Could not find log');
        }
        done();
    });

});
