"use client";
import { useEffect, useMemo, useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { FaRegBell, FaCircleUser, FaUser, FaLock } from "react-icons/fa6";
import { FaSignOutAlt } from "react-icons/fa";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MenuIcon from "@mui/icons-material/Menu";
import { getHumanReadableShortDate, ServerTime } from "@/helpers/dateTime";
import {
  Divider,
  InputBase,
  Paper,
  Popover,
  CircularProgress,
  ListItemIcon,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import { useNavigation } from "@/hooks";
import { searchDDEPatient, searchLocalPatient } from "@/hooks/patientReg";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { ReusableTable } from "../tables/table";
import { ObjectRow } from "@/app/patient/components/visits";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { MRT_ColumnDef } from "material-react-table";
import { searchNPID } from "@/hooks/people";
import {
  AuthGuardComp,
  isAuthorizedForRoles,
} from "@/helpers/authguardcomponent";
import { roles } from "@/constants";

export function NavigationBar({
  onTitleClick,
  handleLogout,
  loggedIn,
}: {
  onTitleClick: () => void;
  handleLogout?: () => void;
  loggedIn?: boolean;
}) {
  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Search state
  const [searchText, setSearchText] = useState("");
  const [searchAnchorEl, setSearchAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  const searchOpen = Boolean(searchAnchorEl) && searchText.trim() !== "";
  const searchPopoverId = searchOpen ? "search-popover" : undefined;
  const isSearchAuthorized = isAuthorizedForRoles([
    roles.ADMIN]);

  const [search, setSearch] = useState({
    firstName: "",
    lastName: "",
    gender: "",
  });

  // Custom debounce hook
  function useDebounce(value: any, delay: any) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      return () => clearTimeout(timer);
    }, [value, delay]);
    return debouncedValue;
  }

  const debouncedSearch = useDebounce(searchText, 300);

  useEffect(() => {
    if (!isSearchAuthorized) return;

    if (debouncedSearch && debouncedSearch.trim() !== "") {
      const searchInput = document.getElementById("search-input");
      setSearchAnchorEl(searchInput);
    } else {
      setSearchAnchorEl(null);
    }
  }, [debouncedSearch, isSearchAuthorized]);

  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.trim() === "") return;
    const payload = splitSearchText(debouncedSearch);
    setSearch({
      firstName: payload.given_name,
      lastName: payload.family_name,
      gender: payload.gender,
    });
  }, [debouncedSearch]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) =>
    setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleSearchPopoverClose = () => setSearchAnchorEl(null);

  const logout = () => {
    handleClose();
    if (handleLogout) handleLogout();
  };

  const { navigateTo } = useNavigation();
  const [currentDateTime, setCurrentDateTime] = useState("");

  useEffect(() => {
    const loadDateTime = async () => {
      await ServerTime.initialize();
      const dateTime = ServerTime.getServerTimeString();
      setCurrentDateTime(getHumanReadableShortDate(dateTime));
    };
    loadDateTime();
  }, []);

  const {
    refetch: refetchDDE,
    isFetching: isFetchingDDE,
    data: ddeData,
  } = searchDDEPatient(search.firstName, search.lastName, search.gender);
  const {
    refetch: refetchLocal,
    isFetching: isFetchingLocal,
    data: localData,
  }: any = searchLocalPatient(search.firstName, search.lastName, search.gender);
  const { refetch: refetchNPID, data: dataNPID } = searchNPID(search.firstName);

  useEffect(() => {
    if (!isSearchAuthorized) return;

    if (search.firstName) {
      refetchLocal();
      // refetchNPID();
    }
    if (search.firstName && search.lastName && search.gender) {
      // refetchDDE();
    }
  }, [search, refetchDDE, refetchLocal, isSearchAuthorized]);

  const splitSearchText = (searchText: string) => {
    const splittedArray = searchText.split(" ");
    return {
      given_name: splittedArray[0] || "",
      family_name: splittedArray[1] || "",
      gender: splittedArray[2] || "",
    };
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearchText(e.target.value);

  const DDETransformedData: any = useMemo(() => {
    if (!ddeData) return [];
    const patientRecords = [
      ...(ddeData.locals || []),
      ...(ddeData.remotes || []),
    ];
    return patientRecords.map((item: any) => ({
      fullname: `${item?.given_name} ${item?.family_name}`,
      birthday: item?.birthdate,
      gender: item?.gender,
      currentAddress: `${item?.addresses?.[0]?.current_district ?? ""},${item?.addresses?.[0]?.current_traditional_authority ?? ""},${item?.addresses?.[0]?.address2 ?? ""}`,
      homeAddress: `${item?.addresses?.[0]?.address1 ?? ""},${item?.addresses?.[0]?.county_district ?? ""}`,
      id: item.uuid,
    }));
  }, [ddeData]);

  const localTransformData = useMemo(() => {
    if (!localData) return [];
    return localData.map((item: any) => ({
      fullname: `${item?.given_name} ${item?.family_name}`,
      birthday: item?.birthdate,
      gender: item?.gender,
      currentAddress: `${item?.addresses?.[0]?.current_district ?? ""},${item?.addresses?.[0]?.current_traditional_authority ?? ""},${item?.addresses?.[0]?.address2 ?? ""}`,
      homeAddress: `${item?.addresses?.[0]?.address1 ?? ""},${item?.addresses?.[0]?.county_district ?? ""}`,
      id: item.uuid,
    }));
  }, [localData]);

  const NPIDTransformData = useMemo(() => {
    if (!dataNPID) return [];
    const patientRecords = [
      ...(dataNPID.locals || []),
      ...(dataNPID.remotes || []),
    ];
    return patientRecords.map((item: any) => ({
      fullname: `${item?.given_name} ${item?.family_name}`,
      birthday: item?.birthdate,
      gender: item?.gender,
      currentAddress: `${item?.addresses?.[0]?.current_district ?? ""},${item?.addresses?.[0]?.current_traditional_authority ?? ""},${item?.addresses?.[0]?.address2 ?? ""}`,
      homeAddress: `${item?.addresses?.[0]?.address1 ?? ""},${item?.addresses?.[0]?.county_district ?? ""}`,
      id: item.uuid,
    }));
  }, [dataNPID]);

  const transformedData = useMemo(() => {
    if (NPIDTransformData.length > 0) return NPIDTransformData;
    return DDETransformedData.length > 0
      ? DDETransformedData
      : localTransformData;
  }, [localTransformData, DDETransformedData, NPIDTransformData]);

  const columns = useMemo<MRT_ColumnDef<ObjectRow>[]>(
    () => [
      { accessorKey: "fullname", header: "Fullname" },
      { accessorKey: "birthday", header: "Birthday" },
      { accessorKey: "gender", header: "Gender" },
      { accessorKey: "currentAddress", header: "Current Address" },
      { accessorKey: "homeAddress", header: "Home Address" },
    ],
    [],
  );

  const allowedRoles = [roles.ADMIN, roles.CLINICIAN, roles.NURSE];

  return (
    <>
      {loggedIn && (
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static" sx={{ backgroundColor: "#006401" }}>
            <Toolbar sx={{ justifyContent: "space-between" }}>
              {/* Left Section */}
              <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
                <IconButton size="large" edge="start" color="inherit">
                  <MenuIcon />
                </IconButton>
                <Typography
                  variant="h6"
                  noWrap
                  sx={{
                    cursor: "pointer",
                    display: { xs: "none", sm: "block" },
                  }}
                  onClick={() => onTitleClick()}
                >
                  <Box lineHeight={1}>
                    <div style={{ fontSize: "16px" }}>MaHIS (AETC)</div>
                    <div style={{ fontSize: "14px" }}>
                      Queen Elizabeth Central Hospital |{" "}
                      <span style={{ color: "rgb(116, 255, 21)" }}>
                        {currentDateTime}
                      </span>
                    </div>
                  </Box>
                </Typography>
              </Box>

              {/* Search Bar */}
              {/* {isAuthorizedForRoles(allowedRoles) && ( */}
              {/* <> */}
              {/* <Paper
                    id="search-input"
                    component="div"
                    sx={{
                      p: "2px 4px",
                      display: "flex",
                      alignItems: "center",
                      minWidth: "45%",
                    }}
                  >
                    <IconButton sx={{ p: "10px" }} aria-label="search">
                      <SearchIcon />
                    </IconButton>
                    <InputBase
                      value={searchText}
                      onChange={handleSearchChange}
                      sx={{ ml: 1, flex: 1 }}
                      placeholder="Add or search for a client by MRN, name, or by scanning a barcode/QR code."
                    />
                    <IconButton
                      color="primary"
                      sx={{ p: "10px", color: "#000" }}
                      aria-label="add new patient"
                      onClick={() => navigateTo(`/registration/new`)}
                    >
                      <PersonAddAltIcon />
                    </IconButton>
                  </Paper> */}
              <Popover
                open={!isSearchAuthorized && Boolean(searchAnchorEl)}
                anchorEl={searchAnchorEl}
                onClose={handleSearchPopoverClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
              >
                <Typography sx={{ p: 1, fontSize: "0.85rem" }}>
                  Search available to Admin only
                </Typography>
              </Popover>

              <Paper
                id="search-input"
                component="div"
                sx={{
                  p: "2px 4px",
                  display: "flex",
                  alignItems: "center",
                  minWidth: "45%",
                  opacity: isSearchAuthorized ? 1 : 0.5,
                  pointerEvents: isSearchAuthorized ? "auto" : "none",
                  cursor: isSearchAuthorized ? "text" : "not-allowed",
                }}
              >
                <IconButton sx={{ p: "10px" }} aria-label="search">
                  <SearchIcon />
                </IconButton>

                <InputBase
                  value={searchText}
                  onChange={handleSearchChange}
                  sx={{ ml: 1, flex: 1 }}
                  placeholder={
                    isSearchAuthorized
                      ? "Add or search for a client by MRN, name, or by scanning a barcode/QR code."
                      : "Search available to Admin only"
                  }
                  disabled={!isSearchAuthorized}
                />

                <IconButton
                  color="primary"
                  sx={{ p: "10px", color: "#000" }}
                  aria-label="add new patient"
                  disabled={!isSearchAuthorized}
                  onClick={() => {
                    if (isSearchAuthorized) {
                      navigateTo(`/registration/new`);
                    }
                  }}
                >
                  <PersonAddAltIcon />
                </IconButton>
              </Paper>

              {/* Search Results */}
              <Popover
                id={searchPopoverId}
                open={searchOpen}
                anchorEl={searchAnchorEl}
                onClose={handleSearchPopoverClose}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "left",
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "left",
                }}
                sx={{ mt: 0.1 }}
                slotProps={{
                  paper: { sx: { width: "97.5vw", maxWidth: "none" } },
                }}
                disableEnforceFocus
                disableAutoFocus
              >
                <Box sx={{ width: "100%" }}>
                  {(isFetchingDDE || isFetchingLocal) && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        p: 2,
                      }}
                    >
                      <CircularProgress />
                    </Box>
                  )}
                  {!isFetchingDDE &&
                    !isFetchingLocal &&
                    transformedData.length > 0 && (
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <ReusableTable<ObjectRow>
                          data={transformedData}
                          columns={columns}
                          title=""
                          showGlobalFilter={false}
                          enableColumnOrdering={false}
                          enableColumnActions={false}
                          enableColumnFilters={false}
                          enableSorting={false}
                          initialState={{
                            columnPinning: {
                              left: ["fullname"],
                            },
                          }}
                          onRowClick={(rowData) => {
                            handleSearchPopoverClose();
                            if (isAuthorizedForRoles(allowedRoles)) {
                              navigateTo(
                                `/patient/${rowData.row.original.id}/profile`,
                              );
                            } else {
                              alert(
                                "You are not authorized to perform this action.",
                              );
                            }
                          }}
                        />
                      </LocalizationProvider>
                    )}
                  {!isFetchingDDE &&
                    !isFetchingLocal &&
                    transformedData.length === 0 && (
                      <Box sx={{ p: 3, textAlign: "center" }}>
                        <Typography>No matching patients found</Typography>
                      </Box>
                    )}
                </Box>
              </Popover>
              {/* </> */}
              {/* // )} */}

              {/* Right Section */}
              <Box
                sx={{ display: "flex", alignItems: "center", color: "#fff" }}
              >
                <IconButton sx={{ color: "#fff", mr: 1 }}>
                  <FaRegBell />
                </IconButton>

                {/* Styled User Menu */}
                <IconButton
                  onClick={handleClick}
                  sx={{
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.1)",
                    },
                  }}
                >
                  <FaCircleUser size={22} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {localStorage.getItem("userName") || "User"}
                  </Typography>
                </IconButton>

                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleClose}
                  PaperProps={{
                    sx: {
                      mt: 1.5,
                      borderRadius: 2,
                      minWidth: 180,
                      boxShadow:
                        "0px 2px 8px rgba(0,0,0,0.2), 0px 0px 0px 1px rgba(0,0,0,0.05)",
                    },
                  }}
                >
                  <MenuItem onClick={handleClose}>
                    <ListItemIcon>
                      <FaUser size={16} />
                    </ListItemIcon>
                    Profile
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleClose();
                      navigateTo("/changePassword");
                    }}
                  >
                    <ListItemIcon>
                      <FaLock size={16} />
                    </ListItemIcon>
                    Change Password
                  </MenuItem>

                  <Divider sx={{ my: 0.5 }} />

                  <MenuItem onClick={logout} sx={{ color: "error.main" }}>
                    <ListItemIcon sx={{ color: "error.main" }}>
                      <FaSignOutAlt size={16} />
                    </ListItemIcon>
                    Logout
                  </MenuItem>
                </Menu>
              </Box>
            </Toolbar>
          </AppBar>
        </Box>
      )}
    </>
  );
}
