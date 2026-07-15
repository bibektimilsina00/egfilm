-- dlhd provider dropped from code; remove any lingering seed rows.
DELETE FROM "SportsProviderConfig" WHERE "kind" = 'dlhd';
