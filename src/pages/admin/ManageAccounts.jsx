import { getAccounts } from "../../api/accountsApi";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import AccountForm from "../../components/features/accounts/UpdateAccount";
import { ToastContainer } from "react-toastify";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Swal from "sweetalert2";
import { deleteAccount } from "../../api/accountsApi";

export default function ManageAccounts() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [showUpdate, setShowUpdate] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const [selectedAccount, setSelectedAccount] = useState(null);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true);
      try {
        const response = await getAccounts();
        setAccounts(response.data);
        setFilteredAccounts(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  const handleSearch = (e) => {
    setFilteredAccounts(
      accounts.filter((account) =>
        account.username.toLowerCase().includes(e.target.value.toLowerCase()),
      ),
    );
  };

  const handleUpdate = (account) => {
    setSelectedAccount(account);
    setShowUpdate(true);
  };

  const handleClose = () => {
    setShowUpdate(false);
    setSelectedAccount(null);
    setShowAdd(false);
  };
  const handleDelete = async (account) => {
    // Confirmation dialog
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete ${account.name}'s account?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444", // Red color
      cancelButtonColor: "#6B7280", // Gray color
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    // Agar user ne confirm kiya
    if (result.isConfirmed) {
      try {
        await deleteAccount(account.id);

        // Success message
        toast.success("Account deleted successfully");

        // List se remove karo
        setAccounts(accounts.filter((acc) => acc.id !== account.id));
        setFilteredAccounts(
          filteredAccounts.filter((acc) => acc.id !== account.id),
        );
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete account");
      }
    }
  };
  const handleAdd = () => {
    setShowAdd(true);
  };

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      <button
        className="absolute top-4 left-4 bg-[#E31212] text-white p-2 rounded-full hover:bg-opacity-90  hover:scale-110 transition-colors shadow-md z-10"
        onClick={() => navigate("/home")}
      >
        <FaArrowLeft size={20} />
      </button>

      <h1 className="text-2xl font-bold mb-4 text-center text-red-500 mt-4">
        Manage Accounts
      </h1>

      <div className="flex items-center bg-gray-100 px-3 py-1 rounded-full flex-1 mx-4 ">
        <input
          type="text"
          placeholder="Search by Arid No/Email..."
          className="bg-transparent flex-1 outline-none text-gray-700"
          onChange={handleSearch}
        />
        <button className="text-gray-500">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner size="large" />
      ) : (
        <div className="mt-6 px-4 space-y-4">
          {filteredAccounts.map((account) => (
            <div
              key={account.id}
              className="bg-white p-2 rounded-lg shadow-md border border-red-500 flex items-center justify-between gap-3 hover:bg-red-100  "
            >
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <h3 className="font-semibold text-gray-900">{account.name}</h3>
                <p className="text-sm text-gray-500">{account.username}</p>
              </div>

              {/* update Account */}
              <div className="flex items-center space-x-4">
                <button
                  className="text-blue-600 hover:text-blue-800"
                  onClick={() => handleUpdate(account)}
                >
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>

                {/* delete Account */}

                <button
                  className="text-red-600 hover:text-red-800"
                  onClick={() => handleDelete(account)}
                >
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 px-4 fixed bottom-4 right-4">
        <button
          className="bg-red-500 text-white text-3xl px-4 py-2 rounded-lg hover:bg-red-600 hover:scale-110 transition-all"
          onClick={handleAdd}
        >
          +
        </button>
      </div>

      {showUpdate && selectedAccount && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 transition-opacity duration-300">
          <div
            className={`bg-white p-6 rounded shadow-lg w-[90vw] max-w-sm md:w-96 transform transition-all duration-300 ease-out relative ${
              showUpdate ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
          >
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              onClick={handleClose}
            >
              X
            </button>
            <AccountForm
              accountname={selectedAccount.name}
              accountusername={selectedAccount.username}
              accountid={selectedAccount.id}
              onClose={handleClose}
              check={"Update"}
            />
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 transition-opacity duration-300">
          <div
            className={`bg-white p-6 rounded shadow-lg w-[90vw] max-w-sm md:w-96 transform transition-all duration-300 ease-out relative ${
              showAdd ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
          >
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              onClick={handleClose}
            >
              X
            </button>
            <AccountForm
              accountname={""}
              accountusername={""}
              accountid={""}
              onClose={handleClose}
              check={"Add"}
            />
          </div>
        </div>
      )}
    </div>
  );
}
