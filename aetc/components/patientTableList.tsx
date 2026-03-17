"use client";
import { checkScreenSize } from "@/hooks";
import {
  PatientCardList,
  PatientCardListServer,
} from "./cards/PatientCardList";
import { BaseTable, ServerPaginationTable } from "./tables";
import { DailyVisitPaginated, PaginationModel } from "@/interfaces";

type props = {
  isLoading: boolean;
  columns: any;
  rows: any;
  formatForMobileView: any;
};

export const PatientTableList = ({
  isLoading,
  columns,
  rows,
  formatForMobileView,
}: props) => {
  const { isMediumOrSmall } = checkScreenSize();

  return isMediumOrSmall ? (
    <PatientCardList
      loading={isLoading}
      dataList={formatForMobileView ? formatForMobileView : []}
    />
  ) : (
    <BaseTable loading={isLoading} columns={columns} rows={rows ? rows : []} />
  );
};

interface PatientTableServerProps {
  data: DailyVisitPaginated;
  searchText: string;
  setSearchString: (search: any) => void;
  setPaginationModel: (pagination: any) => void;
  paginationModel: PaginationModel;
  loading: boolean;
  formatForMobileView: any;
  columns: any;
  onSwitchChange?: (values: any) => void;
  onRowClick?: (row: any) => void;
  getRowHeight?: any;
  dataGridSx?: any;
}

export const PatientTableListServer = ({
  loading,
  searchText,
  setPaginationModel,
  setSearchString,
  paginationModel,
  columns,
  data,
  formatForMobileView,
  onSwitchChange,
  onRowClick,
  getRowHeight,
  dataGridSx,
}: PatientTableServerProps) => {
  const { isMediumOrSmall } = checkScreenSize();

  return isMediumOrSmall ? (
    <PatientCardListServer
      totalPages={data?.total_pages}
      searchText={searchText}
      setSearchString={setSearchString}
      rowCount={10}
      setPaginationModel={setPaginationModel}
      pagination={paginationModel}
      loading={loading}
      dataList={formatForMobileView ? formatForMobileView : []}
    />
  ) : (
    <ServerPaginationTable
      searchText={searchText}
      setSearchString={setSearchString}
      rowCount={data?.data ? data?.totalEntries : 0}
      setPaginationModel={setPaginationModel}
      paginationModel={paginationModel}
      loading={loading}
      rows={data?.data ? data?.data?.map((p) => ({ id: p.uuid, ...p })) : []}
      columns={columns}
      onSwitchChange={onSwitchChange}
      onRowClick={onRowClick}
      getRowHeight={getRowHeight}
      dataGridSx={dataGridSx}
    />
  );
};
