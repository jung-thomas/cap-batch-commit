//const cds = require('@sap/cds')

import * as uuid from 'uuid'
import util from 'util'
/** @type {typeof import("@sap/hana-client")} */
import hanaClient from "@sap/hana-client"
import hanaClientPromise from "@sap/hana-client/extension/Promise.js"
/** @type {typeof import("@sap/xsenv")} */
import * as xsenv from "@sap/xsenv"

async function clearDB(db) {
    console.log(`Clearing existing DB tables`)

    //New DB Referential Integrity Checks means you can't delete parallel any longer
    await db.exec(db.conn, 'DELETE FROM HEADERLOG')
    await db.exec(db.conn, 'DELETE FROM ITEMLOG')

    console.log(`DB Tables Cleared`)
}

async function testData() {
    console.log(`Building Test Data`)
    let header = []
    header.push({
        JeBulkMsgHeaderUUID: uuid.v4(),
        JeBulkMsgHeaderRefID: '1234',
        JeBulkMsgHeaderSenderBusSystemID: "SID",
        Item: []
    })
    header[0].Item.push({
        LogItemID: uuid.v4(),
        LogItemTypeID: 'ABC',
        LogItemSeverityCode: '123',
        LogItemNote: 'Header 1, Item 1',
        LogItemWebURI: 'https://www.sap.com'
    })
    header[0].Item.push({
        LogItemID: uuid.v4(),
        LogItemTypeID: 'XYZ',
        LogItemSeverityCode: '456',
        LogItemNote: 'Header 1, Item 2',
        LogItemWebURI: 'https://www.sap.com'
    })

    header.push({
        JeBulkMsgHeaderUUID: uuid.v4(),
        JeBulkMsgHeaderRefID: '5678',
        JeBulkMsgHeaderSenderBusSystemID: "NSP",
        Item: []
    })
    header[1].Item.push({
        LogItemID: uuid.v4(),
        LogItemTypeID: 'ABCD',
        LogItemSeverityCode: '12',
        LogItemNote: 'Header 2, Item 1',
        LogItemWebURI: 'https://www.sap.com'
    })
    header[1].Item.push({
        LogItemID: uuid.v4(),
        LogItemTypeID: 'WXYZ',
        LogItemSeverityCode: '45',
        LogItemNote: 'Header 2, Item 2',
        LogItemWebURI: 'https://www.sap.com'
    })
    return header
}

async function connect() {
    xsenv.loadEnv()
    let hanaOptions = xsenv.getServices({
        hana: {
            label: "hana"
        }
    })
    let conn = hanaClient.createConnection()
    let connParams = {
        serverNode: hanaOptions.hana.host + ":" + hanaOptions.hana.port,
        uid: hanaOptions.hana.user,
        pwd: hanaOptions.hana.password,
        ca: hanaOptions.hana.certificate,
        encrypt: hanaOptions.hana.encrypt,
        currentSchema: hanaOptions.hana.schema,
        sslValidateCertificate: hanaOptions.hana.sslValidateCertificate,
        pooling: true
    }
    await hanaClientPromise.connect(conn, connParams)
    hanaClientPromise.conn = conn
    return hanaClientPromise
}

async function init() {
    try {
        let db = await connect()

        let result = await db.exec(db.conn, `SELECT CURRENT_USER, CURRENT_SCHEMA FROM DUMMY`)
        console.log(`Connection Information:`)
        console.log(result)
        const data = await testData()
        console.log(util.inspect(data, { maxArrayLength: null, depth: 4 }))
        await clearDB(db)

        //Map Input to Target Data Structure
        let headerData = []
        let itemData = []
        for (let header of data) {
            headerData.push([
                header.JeBulkMsgHeaderUUID,
                header.JeBulkMsgHeaderRefID,
                header.JeBulkMsgHeaderSenderBusSystemID
            ])
            for (let item of header.Item) {
                itemData.push([
                    item.LogItemID,
                    header.JeBulkMsgHeaderUUID,
                    item.LogItemTypeID,
                    item.LogItemSeverityCode,
                    item.LogItemNote,
                    item.LogItemWebURI
                ])
            }
        }
        console.log(util.inspect(headerData, { maxArrayLength: null, depth: 4 }))
        let headerStatement = await db.prepare(db.conn, 'insert into HEADERLOG(ID, REFID, SENDERBUSSYSTEMID) VALUES(?, ?, ?)')
        let itemStatement = await db.prepare(db.conn, 'insert into ITEMLOG(ID, HEADER_ID, TYPEID, SEVERITYCODE, NOTE, WEBURI) VALUES(?, ?, ?, ?, ?, ?)')
        await Promise.all([
            db.executeBatch(headerStatement, headerData),
            db.executeBatch(itemStatement, itemData)
        ])

        console.log(`Finished`)
        process.exit()

    } catch (error) {
        console.error(error)
        process.exit()
    }
}

init()