import React, {useState, useEffect} from 'react';
import { DropdownButton, Dropdown, Form, Button, Row, Col} from 'react-bootstrap';
import { getCategories, emailExpense } from './api';
export function Expenses() {
    const [categories, setCategories] = useState([]);
    const [curCategory, setCurCategory] = useState('');
    const [payee, setPayee] = useState('');
    const [amount, setAmount] = useState('');
    const [files, setFiles] = useState([]);
    const [doCC, setDoCC] = useState('');

    useEffect(() => {
        getCategories().then(res => {
            setCategories(res);
            if (res.length) {
                setCurCategory(res[0].name);
            }
        })
    }, []);

    return <div>
        
        <Form>
            <Form.Group controlId="formBasicEmail">
                <Form.Label>doCC</Form.Label>
                <Form.Check checked={!!doCC} type="checkbox" onClick={() => {
                    setDoCC(!doCC);
                }} label="doCC" />
            </Form.Group>
            <Form.Group controlId="formBasicEmail">
                <Form.Label>Payee</Form.Label>
                <Form.Control as="input" placeholder="Payee" value={payee} onChange={e => {
                    setPayee(e.target.value)
                }} />
                <Form.Text className="text-muted">
                    User to be paid
                </Form.Text>
            </Form.Group>

            <Form.Group controlId="Amount">
                <Form.Label>Amount</Form.Label>
                <Form.Control type="number" placeholder="Amount" value={amount} onChange={e => {
                    setAmount(e.target.value);
                }} />
            </Form.Group>
            <Form.Group controlId="formBasicCheckbox">                
            </Form.Group>
            <DropdownButton title={curCategory} >
                {
                    categories.map((l, ind) => {
                        return <Dropdown.Item key={ind} onSelect={() => setCurCategory(l.name)}>{l.name}</Dropdown.Item>
                    })
                }
            </DropdownButton>            
            {
                files.map(f => {
                    return <Row><Col>{f.name}</Col><Col>{f.buffer.length}</Col><Col><Button onClick={
                        () => {
                            setFiles(files.filter(fl=>fl.name !== f.name))
                        }
                    }>Delete</Button></Col></Row>
                })
            }
            <input type="file" name="newFile" onChange={e => {                
                const name = e.target.value;
                if (files.filter(f => f.name === name).length) return;
                const reader = new FileReader();
                reader.onload = function () {
                    const buffer = reader.result;                    
                    setFiles(files.concat({
                        name: e.target.value,
                        buffer,
                    }))
                };
                reader.readAsDataURL(e.target.files[0]);
            }}/>
            <Button variant="primary" onClick={() => {
                emailExpense({ amount, payee, categary: curCategory, attachements: files, doCC });
            }}>
                Submit
            </Button>
        </Form>
    </div>
}