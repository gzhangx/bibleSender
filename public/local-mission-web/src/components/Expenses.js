import React, {useState, useEffect} from 'react';
import { DropdownButton, Dropdown, Form, Button} from 'react-bootstrap';
import { getCategories, emailExpense } from './api';
export function Expenses() {
    const [categories, setCategories] = useState([]);
    const [curCategory, setCurCategory] = useState('');
    const [payee, setPayee] = useState('');
    const [amount, setAmount] = useState('');

    useEffect(() => {
        getCategories().then(res => {
            setCategories(res);
            if (res.length) {
                setCurCategory(res[0].name);
            }
        })
    }, [curCategory]);

    return <div>
        
        <Form>
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
            <Button variant="primary" onClick={() => {
                emailExpense({ amount, payee, categary: curCategory });
            }}>
                Submit
            </Button>
        </Form>
    </div>
}