//const cds = require('@sap/cds')
import cds from '@sap/cds'
import * as uuid from 'uuid'
import * as path from 'path'
import { fileURLToPath } from 'url'
const __dirname = fileURLToPath(new URL('.', import.meta.url)) 
global.__base = __dirname + "/"
import util from 'util'

async function clearDB(db) {
    console.log(`Clearing existing DB tables`)

    //New DB Referential Integrity Checks means you can't delete parallel any longer
    await db.run(DELETE.from(db.entities.headerLog))
    await db.run(DELETE.from(db.entities.itemLog))
    
    console.log(`DB Tables Cleared`)
}

async function testData(){
    console.log(`Building Test Data`)
    let header = []
    header.push({
        JeBulkMsgHeaderUUID: uuid.v4(), 
        JeBulkMsgHeaderRefID: '1234',
        JeBulkMsgHeaderSenderBusSystemID: "SID",
        Item: []
    })
    header[0].Item.push({
        LogItemTypeID: 'ABC',
        LogItemSeverityCode: '123',
        LogItemNote: 'Header 1, Item 1',
        LogItemWebURI: 'https://www.sap.com'
    })
    header[0].Item.push({
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
        LogItemTypeID: 'ABCD',
        LogItemSeverityCode: '12',
        LogItemNote: 'Header 2, Item 1',
        LogItemWebURI: 'https://www.sap.com'
    })
    header[1].Item.push({
        LogItemTypeID: 'WXYZ',
        LogItemSeverityCode: '45',
        LogItemNote: 'Header 2, Item 2',
        LogItemWebURI: 'https://www.sap.com'
    })
    return header
}

async function init() {
    try {
        const modelPath = path.join(global.__base, '/gen/srv/srv/csn.json')
        console.log(`Model Location: ${modelPath}`)
        const db = await cds.connect.to('db', { model: modelPath })
        const data = await testData()
        console.log(util.inspect(data, { maxArrayLength: null, depth: 4 }))
        await clearDB(db)

    //Map Input to Target Data Structure
    let capData = []
    for (let header of data){
        let cursor = capData.push({
            ID: header.JeBulkMsgHeaderUUID,
            RefId: header.JeBulkMsgHeaderRefID,
            SenderBusSystemID: header.JeBulkMsgHeaderSenderBusSystemID,
            Items: []
        })
        for (let item of header.Item){
           capData[cursor - 1].Items.push({
                TypeId: item.LogItemTypeID,
                SeverityCode: item.LogItemSeverityCode,
                Note: item.LogItemNote,
                WebURI: item.LogItemWebURI
            })
        }
    }
    console.log(util.inspect(capData, { maxArrayLength: null, depth: 4 }))
    await db.run(INSERT.into(db.entities.headerLog).entries(capData))
    console.log(`Finished`)
    process.exit()

    } catch (error) {
        console.error(error)
        process.exit()
    }
}

init()