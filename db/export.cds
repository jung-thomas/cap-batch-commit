using {
    managed,
    sap,
    cuid
} from '@sap/cds/common';

@cds.persistence.exists 
Entity HEADERLOG {
key 	ID: String(36)  @title: 'ID' ; 
	CREATEDAT: Timestamp  @title: 'CREATEDAT' ; 
	CREATEDBY: String(255)  @title: 'CREATEDBY' ; 
	MODIFIEDAT: Timestamp  @title: 'MODIFIEDAT' ; 
	MODIFIEDBY: String(255)  @title: 'MODIFIEDBY' ; 
	REFID: String(5000)  @title: 'REFID' ; 
	SENDERBUSSYSTEMID: String(5000)  @title: 'SENDERBUSSYSTEMID' ;
	Items: Composition of many ITEMLOG on Items.Header = $self; 
}

@cds.persistence.exists 
Entity ITEMLOG: cuid {
//key 	ID: String(36)  @title: 'ID' ; 
	//HEADER_ID: String(36)  @title: 'HEADER_ID' ; 
	TYPEID: String(5000)  @title: 'TYPEID' ; 
	SEVERITYCODE: String(5000)  @title: 'SEVERITYCODE' ; 
	NOTE: String(5000)  @title: 'NOTE' ; 
	WEBURI: String(5000)  @title: 'WEBURI' ; 
	Header: Association to HEADERLOG;
}
