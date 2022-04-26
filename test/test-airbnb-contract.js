const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

function sortDatesWithHashes(dates) {
  dates = dates.map((a) => ({ v: a, k: ethers.BigNumber.from(ethers.utils.hashMessage(a)) }))
  dates = dates.sort((a, b) => a.k - b.k).map(a => a.v);
  return dates;
}

describe("Airbnb", function () {
  let airbnb, weth, signers = [], signer;
  before(async () => {
    signers = await ethers.getSigners();
    signer = await ethers.getSigner();
    const WETH = await ethers.getContractFactory("WETH");
    const Airbnb = await ethers.getContractFactory("Airbnb");
    weth = await WETH.deploy();
    await weth.deployed();
    airbnb = await Airbnb.deploy(weth.address);
    await airbnb.deployed();
  });

  it("Should create a new rental - 1", async () => {
    let dates = ["2021-10-01", "2021-10-10"];
    dates = sortDatesWithHashes(dates);
    const tx = await airbnb.createRental(
      "Tokiyo Property 1",
      "Tokiyo",
      "123",
      "100",
      "string memory unoDescription",
      "string memory dosDescription",
      "string memory imgUrl",
      4,
      ethers.utils.parseEther("0.01"),
      dates
    );
    const d = await tx.wait();
    const { events } = d;
    const count = await airbnb.getTotalRentals();
    expect(Number(count), "total rentals count not increased").to.equal(1);
    const { name, city, lat, long, unoDescription, dosDescription, imgUrl, maxGuests, pricePerDay, datesBooked, id, renter } = events[0].args;
    const rentalObj = JSON.stringify({ name, city, lat, long, unoDescription, dosDescription, imgUrl, maxGuests: Number(maxGuests), pricePerDay: Number(pricePerDay), datesBooked, id: Number(id), renter });
    expect(rentalObj, "rental created event data not correct").to.equal(JSON.stringify({
      name: "Tokiyo Property 1",
      city: "Tokiyo",
      lat: "123",
      long: "100",
      unoDescription: "string memory unoDescription",
      dosDescription: "string memory dosDescription",
      imgUrl: "string memory imgUrl",
      maxGuests: 4,
      pricePerDay: Number(ethers.utils.parseEther("0.01")),
      datesBooked: dates,
      id: 0,
      renter: signer.address
    }));
  });

  it("Should not create a new rental if the date format is wrong", async () => {
    let dates = ["2021-10-1", "2021-10-01"];
    dates = sortDatesWithHashes(dates);
    await expect(airbnb.createRental(
      "Tokiyo Property 2",
      "Tokiyo",
      "123",
      "100",
      "string memory unoDescription",
      "string memory dosDescription",
      "string memory imgUrl",
      4,
      ethers.utils.parseEther("0.01"),
      dates
    )).to.be.revertedWith('InvalidDate');
  });

  it("Should not create a new rental if the dates are not arranged properly", async () => {
    let dates = ["2021-10-10", "2021-10-01"];
    dates = sortDatesWithHashes(dates);
    dates = dates.reverse();
    await expect(airbnb.createRental(
      "Tokiyo Property 2",
      "Tokiyo",
      "123",
      "100",
      "string memory unoDescription",
      "string memory dosDescription",
      "string memory imgUrl",
      4,
      ethers.utils.parseEther("0.01"),
      dates
    )).to.be.revertedWith('UnorderedDates');
  });

  it("Should not create a new rental if the date not possible - 1", async () => {
    let dates = ["2021-10-32", "2021-10-01"];
    dates = sortDatesWithHashes(dates);
    await expect(airbnb.createRental(
      "Tokiyo Property 2",
      "Tokiyo",
      "123",
      "100",
      "string memory unoDescription",
      "string memory dosDescription",
      "string memory imgUrl",
      4,
      ethers.utils.parseEther("0.01"),
      dates
    )).to.be.revertedWith("InvalidDate");
  });

  it("Should not create a new rental if the date not possible - 2", async () => {
    let dates = ["2021-02-29", "2021-10-01"];
    dates = sortDatesWithHashes(dates);
    await expect(airbnb.createRental(
      "Tokiyo Property 2",
      "Tokiyo",
      "123",
      "100",
      "string memory unoDescription",
      "string memory dosDescription",
      "string memory imgUrl",
      4,
      ethers.utils.parseEther("0.01"),
      dates
    )).to.be.revertedWith("InvalidDate");
  });

  it("Should create a new rental - 2", async () => {
    let dates = ["2024-02-29", "2021-10-01"];
    dates = sortDatesWithHashes(dates);
    const tx = await airbnb.createRental(
      "Tokiyo Property 2",
      "Tokiyo",
      "123",
      "100",
      "string memory unoDescription",
      "string memory dosDescription",
      "string memory imgUrl",
      4,
      ethers.utils.parseEther("0.01"),
      dates
    );
    await tx.wait();
    const count = await airbnb.getTotalRentals();
    expect(Number(count), "total rentals count not increased").to.equal(2);
  });

  it("should not create a new rental if not the owner", async () => {
    let dates = ["2024-02-29", "2021-10-01"];
    dates = sortDatesWithHashes(dates);
    await expect(airbnb.connect(signers[1]).createRental(
      "Tokiyo Property 2",
      "Tokiyo",
      "123",
      "100",
      "string memory unoDescription",
      "string memory dosDescription",
      "string memory imgUrl",
      4,
      ethers.utils.parseEther("0.01"),
      dates
    )).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should not create a new booking if insuffient amount paid", async () => {
    await expect(airbnb.connect(signers[1]).addDatesBooked(1, ["2022-02-28"], { value: ethers.utils.parseEther("0.001") })).to.be.revertedWith("IncorrectPayment");
  });

  it("should not create a new booking if already booked for a date", async () => {
    let dates = ["2022-02-28", "2024-02-29"];
    dates = sortDatesWithHashes(dates);
    await expect(airbnb.connect(signers[1]).addDatesBooked(1, dates, { value: ethers.utils.parseEther("0.02") })).to.be.revertedWith("DateUnavailable");
  });

  it("should not create a new booking if invalid date is given - 1", async () => {
    let dates = ["2022-02-28", "2022-02-2"];
    dates = sortDatesWithHashes(dates);
    await expect(airbnb.connect(signers[1]).addDatesBooked(1, dates, { value: ethers.utils.parseEther("0.02") })).to.be.revertedWith("InvalidDate");
  });

  it("should not create a new booking if invalid date is given - 2", async () => {
    let dates = ["2022-02-28", "2022-02-2a"];
    dates = sortDatesWithHashes(dates);
    await expect(airbnb.connect(signers[1]).addDatesBooked(1, dates, { value: ethers.utils.parseEther("0.02") })).to.be.revertedWith("InvalidDate");
  });

  it("should not create a new booking if duplicate dates are given", async () => {
    let dates = ["2022-02-28", "2022-02-28"];
    dates = sortDatesWithHashes(dates);
    await expect(airbnb.connect(signers[1]).addDatesBooked(1, dates, { value: ethers.utils.parseEther("0.02") })).to.be.revertedWith("DuplicateDates");
  });

  it("should not create a new booking if impossible date is given - 1", async () => {
    let dates = ["2022-02-28", "2022-02-29"];
    dates = sortDatesWithHashes(dates);
    await expect(airbnb.connect(signers[1]).addDatesBooked(1, dates, { value: ethers.utils.parseEther("0.02") })).to.be.revertedWith("InvalidDate");
  });

  it("should not create a new booking if impossible date is given - 2", async () => {
    let dates = ["2022-02-28", "2022-13-28"];
    dates = sortDatesWithHashes(dates);
    await expect(airbnb.connect(signers[1]).addDatesBooked(1, dates, { value: ethers.utils.parseEther("0.02") })).to.be.revertedWith("InvalidDate");
  });

  it("should not create a new booking if impossible date is given - 3", async () => {
    let dates = ["2022-02-28", "2022-09-31"];
    dates = sortDatesWithHashes(dates);
    await expect(airbnb.connect(signers[1]).addDatesBooked(1, dates, { value: ethers.utils.parseEther("0.02") })).to.be.revertedWith("InvalidDate");
  });

  it("should not create a new booking if impossible date is given - 4", async () => {
    let dates = ["2022-02-28", "2022-04-31"];
    dates = sortDatesWithHashes(dates);
    await expect(airbnb.connect(signers[1]).addDatesBooked(1, dates, { value: ethers.utils.parseEther("0.02") })).to.be.revertedWith("InvalidDate");
  });

  it("should create a new booking", async () => {
    let dates = ["2022-02-28", "2021-02-28"];
    dates = sortDatesWithHashes(dates);
    const tx = await airbnb.connect(signers[1]).addDatesBooked(1, dates, { value: ethers.utils.parseEther("0.02") });
    const { events } = await tx.wait();
    const { datesBooked, id, booker, city, imgUrl } = events[0].args;
    const booking = JSON.stringify({ datesBooked, id: Number(id), booker, city, imgUrl });
    expect(booking, "booking event data is wrong").to.equal(JSON.stringify({
      datesBooked: dates,
      id: 1,
      booker: signers[1].address,
      city: "Tokiyo",
      imgUrl: "string memory imgUrl"
    }));
    assert(await airbnb.bookings(1, dates[0]), "booking date not updated in the bookings mapping");
    assert(await airbnb.bookings(1, dates[1]), "booking date not updated in the bookings mapping");
  });
});
