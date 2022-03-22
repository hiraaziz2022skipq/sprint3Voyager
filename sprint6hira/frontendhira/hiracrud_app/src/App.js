import React,{useState,useEffect} from 'react'
import './App.css';
import axios from 'axios'
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import {Insert_mongodb} from '../src/components/insert'
import {Update_mongodb} from './components/update'
import {Search_mongodb} from './components/search'
import { DataGrid } from '@mui/x-data-grid';


const api =axios.create({
  baseURL: 'https://7owmyp9l5f.execute-api.us-west-1.amazonaws.com/prod'
})


function App() {


  const [urldata,seturldata]= useState([]);               // for setiing response from getURL
  const [response, setresponse]= useState([]);            // for setting response from addURL
  const [print, setprint] = useState();  
  const [deleteurl, setdeleteurl] = useState("")
  let row=[]

  useEffect(() => {
    // declare the data fetching function
    const getURL = async () => {
      try{
        // let res = await api.get('/')
        let res = await axios.get("http://localhost:3001/");
        seturldata(res.data)
        // console.log(res.data[0]._id)
        
      }
        catch(err){
          console.log(err)
        }
    }

    // call the function
    getURL()
      // make sure to catch any error
      .catch(console.error);
  }, [])

  // const addTolist =()=>{
    // Axios.post("http://localhost:3001/",
    // {urls:url});
  // };

  async function deleteURLS(url){
    try{
      // let res = await api.put('/',{url:oldurls,updateurl:updateurls})
      console.log(deleteurl)
      let res = await axios.delete(`http://localhost:3001/${url}`);
      console.log(res.data)
      setresponse(res.data)
      setprint(true)
      }
      catch(err){
        console.log(err)
        setprint(true)
      }
  }

  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
  
    {
      field: 'url',
      headerName: 'Last name',
      width: 150,
      editable: true,
    }, 
    {
      field: "action",
      headerName: "Action",
      sortable: false,
      renderCell: (params) => {
        const onClick = async(e) => {
          e.stopPropagation(); // don't select this row after clicking
  
          const api = params.api;
          const thisRow= {};
  
          api
            .getAllColumns()
            .filter((c) => c.field !== "__check__" && !!c)
            .forEach(
              (c) => (thisRow[c.field] = params.getValue(params.id, c.field))
            );
            console.log(thisRow.url)

            try{
              // let res = await api.put('/',{url:oldurls,updateurl:updateurls})
              console.log(deleteurl)
              let res = await axios.delete(`http://localhost:3001/${thisRow.url}`);
              console.log(res.data)
              setresponse(res.data)
              setprint(true)
              }
              catch(err){
                console.log(err)
                setprint(true)
              }
        };
  
        return <Button onClick={onClick}>Click</Button>;
      }
    }
  ];


   function getrows(){
            let i=0
            urldata.map((urls) => {
                        row[i]={id: urls._id, url: urls.url};
                        i+=1
                })
        
  }
  

  async function getURL(){
    try{
    // let res = await api.get('/')
    let res = await axios.get("http://localhost:3001/");
    seturldata(res.data)
    console.log(res)
    }
    catch(err){
      console.log(err)
    }
  }


  return (
    <div className="App">
    <h1> CRUD APP WITH MERN</h1>
    <Insert_mongodb/>
    <Update_mongodb/>
    <Search_mongodb/>
   
    <Button variant="contained" onClick={getURL}>Get Urls</Button>

    {getrows()}
    <div style={{ height: 400, width: '100%' }}>
      <DataGrid
        rows={row}
        columns={columns}
        pageSize={5}
        rowsPerPageOptions={[5]}
        checkboxSelection
        disableSelectionOnClick
      />
    
    </div>


    {urldata.map(url=> 
    <p key={url.id}>{url._id} --- {url.url}
    <Button variant="outlined" startIcon={<DeleteIcon />} onClick={() => deleteURLS(url.url)}>
    Delete URL
    </Button>
    </p>)}

    <p>{print? response :null}</p>
    </div>
  );
}

export default App;




