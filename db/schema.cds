using {
    managed,
    sap,
    cuid
} from '@sap/cds/common';

entity headerLog : cuid, managed {
    RefId: String;
    SenderBusSystemID: String;
    Items: Composition of many itemLog on Items.Header = $self;
}

entity itemLog: cuid {
    Header: Association to headerLog;
    TypeId: String;
    SeverityCode: String;
    Note: String;
    WebURI: String;
}