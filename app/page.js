'use client'
import Image from "next/image";
import {useState, useEffect} from 'react';
import { auth, firestore } from "@/firebase";
import { Box, Button, Modal, Stack, TextField, Typography } from "@mui/material";
import { collection, deleteDoc, doc, getDocs, query, setDoc, getDoc} from "firebase/firestore";
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import {useAuthState} from 'react-firebase-hooks/auth';

export default function Home() {
  const [user] = useAuthState(auth)
  const router = useRouter()
  const userSession = sessionStorage.getItem('userId')

  console.log({user})
 
  if (!user && !userSession){
    router.push('/sign-in')
  }

  const[inventory, setInventory] = useState([])
  const[openAdd, setOpenAdd] = useState(false)
  const [openSearch, setOpenSearch] = useState(false);
  const[itemName, setItemName] = useState('')
  const [searchResult, setSearchResult] = useState(null);

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, `users/${userSession}/inventory`))
    const docs = await getDocs(snapshot)
    const inventoryList = []
    docs.forEach((doc)=>{
      inventoryList.push({
        name: doc.id,
        ...doc.data(),
      })
    })
    setInventory(inventoryList)
    console.log(inventoryList)

  }

  const addItem = async (item) => {
    const docRef = doc(collection(firestore, `users/${userSession}/inventory`), item)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()){
      const {quantity} = docSnap.data()
      await setDoc(docRef, {quantity: quantity + 1})
    }
    else{
      await setDoc(docRef, {quantity: 1})
    }

    await updateInventory()
  }

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, `users/${userSession}/inventory`), item)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()){
      const {quantity} = docSnap.data()
      if (quantity === 1){
        await deleteDoc(docRef)
      }
      else{
        await setDoc(docRef, {quantity: quantity - 1})
      }
    }

    await updateInventory()
  }

  const searchItem = async (item) => {
    const foundItem = inventory.find(invItem => invItem.name === item)
    if (foundItem) {
      setSearchResult({ name: foundItem.name, quantity: foundItem.quantity })
    } else {
      setSearchResult({ name: item, message: `${item.charAt(0).toUpperCase() + item.slice(1)} not found`})
    }
  };

  useEffect(()=>{
    updateInventory()
  }, [])

  const handleOpenAdd = () => setOpenAdd(true)
  const handleCloseAdd = () => setOpenAdd(false)

  const handleOpenSearch = () => setOpenSearch(true)
  const handleCloseSearch = () => setOpenSearch(false)
 
  return (
    <Box 
      width="100vw" 
      height="100vh" 
      display="flex" 
      flexDirection="column"
      justifyContent="center" 
      alignItems="center" 
      gap={2}
    >
      <Button 
        sx={{
          position: 'absolute',
          top: 16, 
          right: 16 
        }}
        onClick={() => {
          signOut(auth)
          sessionStorage.removeItem('userId')
          }}
      >
        Log out
      </Button>

      <Modal open={openAdd} onClose={handleCloseAdd}>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          width={400}
          bgcolor="white"
          border="2px solid #000"
          boxShadow={24}
          p={4}
          display="flex"
          flexDirection="column"
          gap={3}
          sx={{
            transform: "translate(-50%,-50%)"
          }}
        >
          <Typography variant="h6">Add Item</Typography>
          <Stack width="100%" direction="row" spacing={2}>
            <TextField
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => {
                setItemName(e.target.value)
              }}
            />
            <Button
              variant="outlined"
              onClick={() => {
                addItem(itemName.toLocaleLowerCase())
                setItemName('')
                handleCloseAdd()
              }}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Modal open={openSearch} onClose={handleCloseSearch}>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          width={400}
          bgcolor="white"
          border="2px solid #000"
          boxShadow={24}
          p={4}
          display="flex"
          flexDirection="column"
          gap={3}
          sx={{
            transform: "translate(-50%,-50%)"
          }}
        >
          <Typography variant="h6">Search Item</Typography>
          <Stack width="100%" direction="row" spacing={2}>
            <TextField
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => {
                setItemName(e.target.value)
              }}
            />
            <Button
              variant="outlined"
              onClick={() => {
                searchItem(itemName.toLowerCase());
                setItemName('')
              }}
            >
              Search
            </Button>
          </Stack>
              {searchResult && (
                <Box display="flex" flexDirection="column" alignItems="center" mt={2}>
                  {searchResult.message ? (
                    <Typography variant="h5" color="#333" textAlign="center">
                      {searchResult.message}
                    </Typography>
                    ) : (
                      <>
                        <Stack direction="row" spacing={2}>
                          <Typography variant="h5" color="#333" textAlign="center">
                            {searchResult.name.charAt(0).toUpperCase() + searchResult.name.slice(1)}
                          </Typography>
                          <Typography variant="h5" color="#333" textAlign="center">
                            {searchResult.quantity}
                          </Typography>
                          
                            <Button 
                              variant="contained" 
                              onClick={async () => {
                                addItem(searchResult.name)
                                setSearchResult({ ...searchResult, quantity: searchResult.quantity + 1 })
                              }}
                            >
                              Add
                            </Button>
                            <Button 
                              variant="contained" 
                              onClick={async () => {
                                removeItem(searchResult.name)
                                setSearchResult(prev => prev.quantity > 1 
                                  ? { ...prev, quantity: prev.quantity - 1 } 
                                  : { name: searchResult.name, message: `${searchResult.name.charAt(0).toUpperCase() + searchResult.name.slice(1)} not found`})
                              }}
                            >
                              Remove
                            </Button>
                        </Stack>
                      </>
                  )}
               </Box>
              )}
        </Box>
      </Modal>  

      <Stack direction="row" spacing={2}>
        <Button 
          variant="contained" 
          onClick={()=> {
            handleOpenAdd()
          }}
        >
          Add New Item
        </Button>
        <Button 
          variant="contained" 
          onClick={()=> {
            handleOpenSearch()
          }}
        >
          Search Item
        </Button>
      </Stack>

      <Box border="1px solid #333">
        <Box
          width="800px"
          height="100px"
          bgcolor="#ADD8E6"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Typography variant="h2" color="#333">
            Inventory Items
          </Typography>
        </Box>
        <Stack width="800px" height="300px" spacing={2} overflow="auto">
          {
            inventory.map(({name, quantity}) => (
              <Box 
                key={name} 
                width="100%" 
                minHeight="150px" 
                display="flex" 
                alignItems="center" 
                justifyContent="space-between"
                bgcolor= "#f0f0f0"
                padding={5}
              >
                <Typography variant="h3" color="#333" textAlign="center">
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </Typography>
                <Typography variant="h3" color="#333" textAlign="center">
                  {quantity}
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Button 
                    variant="contained" 
                    onClick={() => {
                      addItem(name)
                      if (searchResult?.name === name) {
                        setSearchResult({ ...searchResult, quantity: searchResult.quantity + 1 });
                      }
                    }}
                  >
                    Add
                  </Button>
                  <Button 
                    variant="contained" 
                    onClick={() => {
                      removeItem(name)
                      if (searchResult?.name === name) {
                        setSearchResult(prev => prev.quantity > 1 
                          ? { ...prev, quantity: prev.quantity - 1 } 
                          : { name: searchResult.name, message: `${searchResult.name.charAt(0).toUpperCase() + searchResult.name.slice(1)} not found`})
                      }
                    }}
                  >
                    Remove
                  </Button>
                </Stack>
              </Box>
            ))
          }
        </Stack>
      </Box>

    </Box>
  )
}
