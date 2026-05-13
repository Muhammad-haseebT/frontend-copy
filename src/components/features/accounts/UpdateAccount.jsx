import { ToastContainer, toast } from "react-toastify";
import { useState } from "react";
import { updateAccount } from "../../../api/accountsApi";
import { addAccount } from "../../../api/accountsApi";

const AccountForm = ({
  accountname,
  accountusername,
  accountid,
  onClose,
  check,
}) => {
  const [account, setAccount] = useState({
    name: accountname,
    username: accountusername,
    password: "",
    confirmPassword: "",
  });
  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    try {
      await updateAccount(accountid, account);
      toast.success("Account updated successfully");
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update account");
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };
  const handleAddAccount = async (e) => {
    e.preventDefault();
    try {
      await addAccount(account);
      toast.success("Account added successfully");
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error("Failed to add account");
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-center text-red-500 mt-4">
        {check} Account
      </h1>
      <form
        onSubmit={check == "Update" ? handleUpdateAccount : handleAddAccount}
        className="space-y-4"
      >
        <input
          type="text"
          placeholder="Name"
          value={account.name}
          onChange={(e) => setAccount({ ...account, name: e.target.value })}
          className="border border-red-500 rounded p-2 mb-2"
        />

        <input
          type="text"
          placeholder="Username"
          value={account.username}
          onChange={(e) => setAccount({ ...account, username: e.target.value })}
          className="border border-red-500 rounded p-2 mb-2"
        />

        <input
          type="text"
          placeholder="Password"
          value={account.password}
          onChange={(e) => setAccount({ ...account, password: e.target.value })}
          className="border border-red-500 rounded p-2 mb-2"
        />

        <input
          type="text"
          placeholder="Confirm Password"
          value={account.confirmPassword}
          onChange={(e) =>
            setAccount({ ...account, confirmPassword: e.target.value })
          }
          className="border border-red-500 rounded p-2 mb-2"
        />
        <br />

        <button
          className="bg-red-500 text-white p-2 rounded hover:bg-red-600 hover:scale-105 transition-all"
          type="submit"
        >
          {check}
        </button>
      </form>
    </div>
  );
};

export default AccountForm;
