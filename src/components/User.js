import React, { useEffect, useState } from "react";
import { useMoralis } from "react-moralis";
import { Icon, Modal, Card } from "web3uikit";

function User() {
  const [isVisible, setVisible] = useState(false);
  const { Moralis, account } = useMoralis();
  const [userRentals, setUserRentals] = useState([]);

  useEffect(() => {
    (async () => {
      const Rentals = Moralis.Object.extend("newBookings");
      const query = new Moralis.Query(Rentals);
      query.equalTo("booker", account);
      const results = await query.find();
      setUserRentals(results);
    })();
  }, [account, isVisible]);

  return (
    <>
      <div onClick={() => setVisible(true)}>
        <Icon fill="#000000" size={24} svg="user" />
      </div>

      <Modal
        onCloseButtonPressed={() => setVisible(false)}
        hasFooter={false}
        title="Your Stays"
        isVisible={isVisible}
      >
        <div style={{ display: 'flex', justifyContent: 'start', flexWrap: 'wrap', gap: '10px' }}>
          {userRentals.map((r, i) => <div key={i} style={{ width: '200px' }}>
            <Card
              isDisabled
              title={r.attributes.city}
              description={`${r.attributes.datesBooked[0]} for ${r.attributes.datesBooked.length} Days`}
            >
              <div>
                <img
                  width="180px"
                  src={r.attributes.imgUrl}
                />
              </div>
            </Card>
          </div>)}
        </div>
      </Modal>
    </>
  );
}

export default User;
