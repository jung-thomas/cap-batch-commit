using headerLog from '../db/schema';
using itemLog from '../db/schema';

service Logs {
    entity header as projection on headerLog;
    entity item as projection on itemLog;
}