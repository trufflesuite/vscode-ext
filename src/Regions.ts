// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export interface IRegion {
  geoOrder?: number;
  key: string;
  label: string;
  regionSegment?: number;
}

export function getAzureRegions(): IRegion[] {
  return [
    {
      geoOrder: 5,
      key: 'eastasia',
      label: 'eastasia (East Asia)',
    },
    {
      geoOrder: 4,
      key: 'southeastasia',
      label: 'southeastasia (Southeast Asia)',
    },
    {
      geoOrder: 1,
      key: 'centralus',
      label: 'centralus (Central US)',
    },
    {
      key: 'eastus',
      label: 'eastus (East US)',
    },
    {
      key: 'eastus2',
      label: 'eastus2 (East US 2)',
    },
    {
      geoOrder: 1,
      key: 'westus',
      label: 'westus (West US)',
    },
    {
      geoOrder: 1,
      key: 'northcentralus',
      label: 'northcentralus (North Central US)',
    },
    {
      key: 'southcentralus',
      label: 'southcentralus (South Central US)',
    },
    {
      geoOrder: 8,
      key: 'northeurope',
      label: 'northeurope (North Europe)',
    },
    {
      geoOrder: 8,
      key: 'westeurope',
      label: 'westeurope (West Europe)',
    },
    {
      geoOrder: 4,
      key: 'japanwest',
      label: 'japanwest (Japan West)',
      regionSegment: 1,
    },
    {
      geoOrder: 5,
      key: 'japaneast',
      label: 'japaneast (Japan East)',
    },
    {
      geoOrder: 11,
      key: 'brazilsouth',
      label: 'brazilsouth (Brazil South)',
    },
    {
      geoOrder: 4,
      key: 'australiaeast',
      label: 'australiaeast (Australia East)',
    },
    {
      geoOrder: 4,
      key: 'australiasoutheast',
      label: 'australiasoutheast (Australia Southeast)',
      regionSegment: 1,
    },
    {
      geoOrder: 4,
      key: 'southindia',
      label: 'southindia (South India)',
      regionSegment: 1,
    },
    {
      geoOrder: 5,
      key: 'centralindia',
      label: 'centralindia (Central India)',
    },
    {
      geoOrder: 4,
      key: 'westindia',
      label: 'westindia (West India)',
      regionSegment: 1,
    },
    {
      geoOrder: 7,
      key: 'canadacentral',
      label: 'canadacentral (Canada Central)',
    },
    {
      geoOrder: 6,
      key: 'canadaeast',
      label: 'canadaeast (Canada East)',
      regionSegment: 1,
    },
    {
      geoOrder: 8,
      key: 'uksouth',
      label: 'uksouth (UK South)',
    },
    {
      geoOrder: 8,
      key: 'ukwest',
      label: 'ukwest (UK West)',
      regionSegment: 1,
    },
    {
      key: 'westcentralus',
      label: 'westcentralus (West Central US)',
      regionSegment: 1,
    },
    {
      key: 'westus2',
      label: 'westus2 (West US 2)',
    },
    {
      geoOrder: 5,
      key: 'koreacentral',
      label: 'koreacentral (Korea Central)',
    },
    {
      geoOrder: 4,
      key: 'koreasouth',
      label: 'koreasouth (Korea South)',
      regionSegment: 1,
    },
    {
      geoOrder: 9,
      key: 'francecentral',
      label: 'francecentral (France Central)',
    },
    {
      geoOrder: 8,
      key: 'francesouth',
      label: 'francesouth (France South)',
      regionSegment: 1,
    },
    {
      geoOrder: 4,
      key: 'australiacentral',
      label: 'australiacentral (Australia Central)',
      regionSegment: 1,
    },
    {
      geoOrder: 4,
      key: 'australiacentral2',
      label: 'australiacentral2 (Australia Central 2)',
      regionSegment: 1,
    },
    {
      geoOrder: 3,
      key: 'southafricanorth',
      label: 'southafricanorth (South Africa North)',
    },
    {
      geoOrder: 2,
      key: 'southafricawest',
      label: 'southafricawest (South Africa West)',
      regionSegment: 1,
    },
  ];
}
