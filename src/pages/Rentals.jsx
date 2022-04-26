import React, { Fragment, useEffect, useState } from "react";
import "./Rentals.css";
import { Link, useLocation } from "react-router-dom";
import logo from "../images/airbnbRed.png";
import { Button, ConnectButton, Icon, useNotification } from "web3uikit";
import RentalsMap from "../components/RentalsMap";
import { useMoralis, useWeb3ExecuteFunction } from "react-moralis";
import { ethers } from "ethers";
import { getError, getFunctionOptionForMoralis, sortDatesWithHashes } from "../helpers";
import User from "../components/User";

const Rentals = () => {
  const { state: searchFilters } = useLocation();
  const { Moralis, isInitialized, account } = useMoralis();
  const [highLight, setHighLight] = useState(-1);
  const [rentalsList, setRentalsList] = useState([]);
  const [cords, setCords] = useState([]);
  const contractProcessor = useWeb3ExecuteFunction();
  const dispatch = useNotification();

  function handleSuccess() {
    dispatch({
      type: 'success',
      message: `Nice! You are going to ${searchFilters.destination}`,
      title: 'Booking Successful',
      position: 'topL',
    });
  }

  function handleError(error) {
    let errorMsg = "Something went wrong";
    if (error.code === 1) {
      errorMsg = "Please switch to Rinkeby Network";
    } else if (error.code === 4001) {
      errorMsg = "User denied the request";
    } else {
      try {
        const errorF = getError(error.error.data.originalError.data)
        errorMsg = errorF.name;
      } catch (err) {
      }
    }
    dispatch({
      type: 'error',
      message: `${errorMsg}`,
      title: 'Booking Failed',
      position: 'topL',
    });
  }

  function handleNoAccount() {
    dispatch({
      type: 'error',
      message: `You need to connect your wallet to book a rental`,
      title: 'Not Connected',
      position: 'topL',
    });
  }

  useEffect(() => {
    if (!isInitialized) return;
    (async () => {
      const Rentals = Moralis.Object.extend("rentals");
      const query = new Moralis.Query(Rentals);
      query.equalTo("city", searchFilters.destination);
      query.greaterThanOrEqualTo("maxGuests_decimal", searchFilters.guests);
      const results = await query.find();
      setRentalsList(results);
      const cords = results.map(({ attributes: { lat, long: lng } }) => ({ lat, lng }));
      setCords(cords);
    })();
  }, [isInitialized, searchFilters]);

  async function bookRental(start, end, id, dayPrice) {
    let arr = [];
    for (const dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
      arr.push(new Date(dt).toISOString().slice(0, 10));
    }
    arr = sortDatesWithHashes(arr);
    const provider = await Moralis.enableWeb3();
    if (provider.network.chainId !== 4) {
      handleError({ code: 1 });
      return;
    }
    const options = getFunctionOptionForMoralis("addDatesBooked", { id: Number(id), newBookings: arr }, (dayPrice * arr.length).toString());
    await contractProcessor.fetch({
      params: options,
      onSuccess() {
        handleSuccess();
      },
      onError(error) {
        handleError(error);
      }
    })
  }

  if (cords.length === 0) {
    return <>Loading</>;
  }

  return (
    <>
      <div className="topBanner">
        <div className="">
          <Link to="/">
            <img className="logo" src={logo} alt="logo" />
          </Link>
        </div>
        <div className="searchReminder">
          <div className="filter">
            {searchFilters.destination}
          </div>
          <div className="vl" />
          <div className="filter">
            {`
              ${searchFilters.checkIn.toLocaleString("default", { month: "short" })}
              ${searchFilters.checkIn.toLocaleString("default", { day: "2-digit", })}
              -
              ${searchFilters.checkOut.toLocaleString("default", { month: "short" })}
              ${searchFilters.checkOut.toLocaleString("default", { day: "2-digit", })}
            `}
          </div>
          <div className="vl" />
          <div className="filter">
            {searchFilters.guests} Guest
          </div>
          <div className="searchFiltersIcon">
            <Icon fill="#ffffff" size={20} svg="search" />
          </div>
        </div>
        <div className="lrContainers">
          {account && <User account={account} />}
          <ConnectButton />
        </div>
      </div>

      <hr className="line" />
      <div className="rentalsContent">
        <div className="rentalsContentL">
          Stays Available For Your Destination
          {rentalsList &&
            rentalsList.map((rental, i) => <Fragment key={i}>
              <hr className="line2" />
              <div className={highLight === i ? "rentalDivH" : "rentalDiv"}>
                <img src={rental.attributes.imgUrl} alt="rental" className="rentalImg" />
                <div className="rentalInfo">
                  <div className="rentalTitle">{rental.attributes.name}</div>
                  <div className="rentalDesc">{rental.attributes.unoDescription}</div>
                  <div className="rentalDesc">{rental.attributes.dosDescription}</div>
                  <div className="bottomButton">
                    <Button
                      onClick={() => {
                        if (account) {
                          bookRental(
                            searchFilters.checkIn,
                            searchFilters.checkOut,
                            rental.attributes.uid_decimal.value.$numberDecimal,
                            Number(rental.attributes.pricePerDay_decimal.value.$numberDecimal),
                          );
                        } else {
                          handleNoAccount();
                        }
                      }}
                      text="Stay Here" />
                    <div className="price">
                      <Icon fill="#808080" size={10} svg="matic" /> {ethers.utils.formatEther(rental.attributes.pricePerDay)} / Day
                    </div>
                  </div>
                </div>
              </div>
            </Fragment>)}
        </div>
        <div className="rentalsContentR">
          <RentalsMap locations={cords} setHighLight={setHighLight} />
        </div>
      </div>
    </>
  );
};

export default Rentals;
